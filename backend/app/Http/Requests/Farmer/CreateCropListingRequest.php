<?php

namespace App\Http\Requests\Farmer;

use Illuminate\Foundation\Http\FormRequest;

class CreateCropListingRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'crop_type'          => ['required', 'string', 'max:100'],
            'quantity_kg'        => ['required', 'numeric', 'min:1'],
            'quality_grade'      => ['required', 'in:A,B,C'],
            'asking_price_bdt'   => ['required', 'numeric', 'min:1'],
            'location_district'  => ['sometimes', 'string'],
            'location_upazila'   => ['sometimes', 'string'],
            'harvest_date'       => ['sometimes', 'date', 'after_or_equal:today'],
            'description'        => ['sometimes', 'string', 'max:1000'],
            'photos'             => ['sometimes', 'array', 'max:8'],
            'photos.*'           => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'crop_type.required'        => 'ফসলের ধরন দিন।',
            'quantity_kg.required'      => 'পরিমাণ (কেজি) দিন।',
            'quality_grade.required'    => 'মান নির্বাচন করুন (A/B/C)।',
            'asking_price_bdt.required' => 'চাহিদা মূল্য দিন।',
        ];
    }
}
