<?php

namespace App\Http\Requests\Officer;

use Illuminate\Foundation\Http\FormRequest;

class BroadcastRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'     => ['required', 'string', 'min:5', 'max:200'],
            'message'   => ['required', 'string', 'min:10', 'max:500'],
            'district'  => ['sometimes', 'string'],
            'crop_type' => ['sometimes', 'nullable', 'string'],
            'channel'   => ['sometimes', 'in:push,sms,both'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'   => 'বার্তার শিরোনাম দিন।',
            'message.required' => 'বার্তার বিষয়বস্তু লিখুন।',
            'message.max'      => 'বার্তা সর্বোচ্চ ৫০০ অক্ষরের হতে হবে (SMS সীমা)।',
        ];
    }
}
