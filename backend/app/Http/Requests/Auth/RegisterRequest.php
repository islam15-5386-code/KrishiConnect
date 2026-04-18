<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'role'               => ['sometimes', 'in:farmer,agricultural_officer,company,vendor'],
            'full_name'          => ['required', 'string', 'min:2', 'max:100'],
            'division'           => ['required', 'string'],
            'district'           => ['required', 'string'],
            'upazila'            => ['required', 'string'],
            'preferred_language' => ['sometimes', 'in:bn,en'],
            // Farmer-specific
            'land_size_acres'    => ['sometimes', 'numeric', 'min:0', 'max:10000'],
            'primary_crops'      => ['sometimes', 'array'],
            'primary_crops.*'    => ['string'],
            'national_id'        => ['sometimes', 'nullable', 'string', 'min:10', 'max:20'],
            // Officer-specific
            'employee_id'        => ['sometimes', 'string'],
            'specialization'     => ['sometimes', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'পুরো নাম দিন।',
            'district.required'  => 'জেলা নির্বাচন করুন।',
            'division.required'  => 'বিভাগ নির্বাচন করুন।',
            'upazila.required'   => 'উপজেলা নির্বাচন করুন।',
        ];
    }
}
