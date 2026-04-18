<?php

namespace Tests\Feature\Farmer;

use App\Models\AdvisoryTicket;
use App\Models\User;
use App\Models\FarmerProfile;
use App\Services\AdvisoryRoutingService;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdvisoryTicketTest extends TestCase
{
    use RefreshDatabase;

    private User $farmer;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('s3');

        // Mock services to prevent real external calls
        $this->mock(NotificationService::class, function ($mock) {
            $mock->shouldReceive('sendSms')->andReturn(true);
            $mock->shouldReceive('sendPush')->andReturn(true);
        });

        $this->mock(AdvisoryRoutingService::class, function ($mock) {
            $mock->shouldReceive('assignOfficer')->andReturn(null);
        });

        $this->farmer = User::factory()->create(['role' => 'farmer', 'is_verified' => true]);
        FarmerProfile::factory()->create([
            'user_id'  => $this->farmer->id,
            'district' => 'ময়মনসিংহ',
            'division' => 'ময়মনসিংহ',
        ]);
        $this->token = $this->farmer->createApiToken()->plainTextToken;
    }

    public function test_farmer_can_create_advisory_ticket(): void
    {
        $response = $this->withToken($this->token)
            ->postJson('/api/v1/advisory/tickets', [
                'title'       => 'ধানে পোকার আক্রমণ',
                'description' => 'আমার বোরো ধানে একটি অজানা পোকা আক্রমণ করেছে। পাতা হলুদ হয়ে যাচ্ছে।',
                'crop_type'   => 'ধান',
            ]);

        $response->assertCreated()->assertJson(['success' => true]);
        $this->assertDatabaseHas('advisory_tickets', [
            'farmer_id' => $this->farmer->id,
            'crop_type' => 'ধান',
            'status'    => 'open',
        ]);
    }

    public function test_ticket_creation_with_images(): void
    {
        $images = [
            UploadedFile::fake()->image('crop1.jpg', 400, 400)->size(1024),
            UploadedFile::fake()->image('crop2.jpg', 400, 400)->size(512),
        ];

        $response = $this->withToken($this->token)
            ->postJson('/api/v1/advisory/tickets', [
                'title'       => 'পাটের রোগ',
                'description' => 'পাটের কাণ্ড পচে যাচ্ছে এবং পাতায় হলুদ দাগ দেখা দিচ্ছে।',
                'crop_type'   => 'পাট',
                'images'      => $images,
            ]);

        $response->assertCreated();
        $this->assertDatabaseCount('advisory_images', 2);
    }

    public function test_ticket_rejects_more_than_5_images(): void
    {
        $images = array_fill(0, 6, UploadedFile::fake()->image('crop.jpg')->size(100));

        $response = $this->withToken($this->token)
            ->postJson('/api/v1/advisory/tickets', [
                'title'       => 'সবজিতে রোগ',
                'description' => 'আমার সবজি বাগানে একটি অজানা রোগ দেখা দিয়েছে। পাতা শুকিয়ে যাচ্ছে।',
                'crop_type'   => 'সবজি',
                'images'      => $images,
            ]);

        $response->assertUnprocessable();
    }

    public function test_farmer_can_list_own_tickets(): void
    {
        AdvisoryTicket::factory()->count(3)->create(['farmer_id' => $this->farmer->id]);
        // Another farmer's ticket — should not appear
        $otherFarmer = User::factory()->create(['role' => 'farmer', 'is_verified' => true]);
        AdvisoryTicket::factory()->create(['farmer_id' => $otherFarmer->id]);

        $response = $this->withToken($this->token)->getJson('/api/v1/advisory/tickets');

        $response->assertOk()
                 ->assertJson(['success' => true])
                 ->assertJsonPath('data.total', 3);
    }

    public function test_role_guard_blocks_non_farmer(): void
    {
        $officer = User::factory()->create(['role' => 'agricultural_officer', 'is_verified' => true]);
        $token   = $officer->createApiToken()->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/v1/advisory/tickets');
        $response->assertForbidden();
    }
}
