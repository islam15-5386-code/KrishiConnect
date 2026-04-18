<?php

namespace App\Http\Requests\Farmer;

use Illuminate\Foundation\Http\FormRequest;

class RateOfficerRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'rating'   => ['required', 'integer', 'min:1', 'max:5'],
            'feedback' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'rating.required' => '১ থেকে ৫ এর মধ্যে রেটিং দিন।',
            'rating.min'      => 'রেটিং কমপক্ষে ১ হতে হবে।',
            'rating.max'      => 'রেটিং সর্বোচ্চ ৫ হতে পারে।',
        ];
    }
}
