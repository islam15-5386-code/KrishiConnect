<?php

namespace Tests\Feature\Services;

use App\Models\AdvisoryTicket;
use App\Models\OfficerProfile;
use App\Models\User;
use App\Services\AdvisoryRoutingService;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdvisoryRoutingServiceTest extends TestCase
{
    use RefreshDatabase;

    private AdvisoryRoutingService $routingService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('sendPush')->andReturn(true);
            $mock->shouldReceive('sendSms')->andReturn(true);
        });

        $this->routingService = app(AdvisoryRoutingService::class);
    }

    public function test_assigns_officer_from_same_district(): void
    {
        $farmer  = User::factory()->create(['role' => 'farmer', 'is_verified' => true]);
        $officer = User::factory()->create(['role' => 'agricultural_officer', 'is_verified' => true, 'is_active' => true]);
        OfficerProfile::factory()->create([
            'user_id'  => $officer->id,
            'district' => 'ময়মনসিংহ',
            'division' => 'ময়মনসিংহ',
        ]);

        $ticket = AdvisoryTicket::factory()->create([
            'farmer_id' => $farmer->id,
            'district'  => 'ময়মনসিংহ',
            'division'  => 'ময়মনসিংহ',
            'status'    => 'open',
        ]);

        $this->routingService->assignOfficer($ticket);

        $this->assertDatabaseHas('advisory_tickets', [
            'id'                   => $ticket->id,
            'assigned_officer_id'  => $officer->id,
            'status'               => 'assigned',
        ]);
    }

    public function test_falls_back_to_division_when_no_district_officer(): void
    {
        $farmer  = User::factory()->create(['role' => 'farmer', 'is_verified' => true]);
        $officer = User::factory()->create(['role' => 'agricultural_officer', 'is_verified' => true, 'is_active' => true]);
        OfficerProfile::factory()->create([
            'user_id'  => $officer->id,
            'district' => 'কিশোরগঞ্জ',   // Different district
            'division' => 'ময়মনসিংহ',     // Same division
        ]);

        $ticket = AdvisoryTicket::factory()->create([
            'farmer_id' => $farmer->id,
            'district'  => 'নেত্রকোণা',   // No officer in this district
            'division'  => 'ময়মনসিংহ',
            'status'    => 'open',
        ]);

        $this->routingService->assignOfficer($ticket);

        $this->assertDatabaseHas('advisory_tickets', [
            'id'     => $ticket->id,
            'status' => 'assigned',
        ]);
        $this->assertNotNull($ticket->fresh()->assigned_officer_id);
    }

    public function test_escalates_when_no_officer_available(): void
    {
        $farmer = User::factory()->create(['role' => 'farmer', 'is_verified' => true]);
        $ticket = AdvisoryTicket::factory()->create([
            'farmer_id' => $farmer->id,
            'district'  => 'সুনামগঞ্জ',
            'division'  => 'সিলেট',
            'status'    => 'open',
        ]);

        $this->routingService->assignOfficer($ticket);

        $this->assertDatabaseHas('advisory_tickets', [
            'id'     => $ticket->id,
            'status' => 'escalated',
        ]);
    }

    public function test_assigns_least_loaded_officer(): void
    {
        $farmer  = User::factory()->create(['role' => 'farmer', 'is_verified' => true]);
        $busy    = User::factory()->create(['role' => 'agricultural_officer', 'is_verified' => true, 'is_active' => true]);
        $free    = User::factory()->create(['role' => 'agricultural_officer', 'is_verified' => true, 'is_active' => true]);

        foreach ([$busy, $free] as $officer) {
            OfficerProfile::factory()->create(['user_id' => $officer->id, 'district' => 'ঢাকা', 'division' => 'ঢাকা']);
        }

        // Give busy officer 3 open tickets
        AdvisoryTicket::factory()->count(3)->create(['assigned_officer_id' => $busy->id, 'status' => 'assigned', 'farmer_id' => $farmer->id]);

        $ticket = AdvisoryTicket::factory()->create([
            'farmer_id' => $farmer->id,
            'district'  => 'ঢাকা',
            'division'  => 'ঢাকা',
            'status'    => 'open',
        ]);

        $this->routingService->assignOfficer($ticket);

        // Should assign to the free officer, not the busy one
        $this->assertEquals($free->id, $ticket->fresh()->assigned_officer_id);
    }
}
