<?php

namespace App\Http\Requests\Farmer;

use Illuminate\Foundation\Http\FormRequest;

class CreateTicketRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'min:5', 'max:200'],
            'description' => ['required', 'string', 'min:20'],
            'crop_type'   => ['required', 'string', 'max:100'],
            'district'    => ['sometimes', 'string'],
            // Max 5 images, each max 5MB, images only
            'images'      => ['sometimes', 'array', 'max:5'],
            'images.*'    => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'       => 'সমস্যার শিরোনাম দিন।',
            'description.required' => 'বিস্তারিত বর্ণনা দিন।',
            'description.min'      => 'বর্ণনা কমপক্ষে ২০ অক্ষরের হতে হবে।',
            'crop_type.required'   => 'ফসলের ধরন নির্বাচন করুন।',
            'images.max'           => 'সর্বোচ্চ ৫টি ছবি দেওয়া যাবে।',
            'images.*.max'         => 'প্রতিটি ছবি সর্বোচ্চ ৫ MB হতে হবে।',
        ];
    }
}
