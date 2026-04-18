<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'phone_number' => ['required', 'string', 'regex:/^(?:\+?880|0)1[3-9]\d{8}$/'],
            'purpose'      => ['sometimes', 'in:login,register'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.required' => 'মোবাইল নম্বর দিন।',
            'phone_number.regex'    => 'বৈধ বাংলাদেশী মোবাইল নম্বর দিন।',
        ];
    }
}
