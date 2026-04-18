<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class SubmitOfferRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'offered_price_bdt' => ['required', 'numeric', 'min:1'],
            'quantity_kg'       => ['required', 'numeric', 'min:1'],
            'pickup_logistics'  => ['sometimes', 'nullable', 'string', 'max:500'],
            'note'              => ['sometimes', 'nullable', 'string', 'max:300'],
            'expires_in_hours'  => ['sometimes', 'integer', 'min:1', 'max:168'], // max 1 week
        ];
    }

    public function messages(): array
    {
        return [
            'offered_price_bdt.required' => 'অফার মূল্য দিন।',
            'quantity_kg.required'       => 'ক্রয় পরিমাণ (কেজি) দিন।',
        ];
    }
}
