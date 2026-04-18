<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'min:2', 'max:200'],
            'category'        => ['required', 'in:Fertilizer,Pesticide,Seed,Tool,Equipment,Other'],
            'description'     => ['sometimes', 'nullable', 'string', 'max:2000'],
            'price_bdt'       => ['required', 'numeric', 'min:1'],
            'stock_quantity'  => ['required', 'integer', 'min:0'],
            'unit'            => ['sometimes', 'in:piece,kg,litre,packet,bag'],
            'images'          => ['sometimes', 'array', 'max:6'],
            'images.*'        => ['image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'certifications'  => ['sometimes', 'array'],
            'certifications.*'=> ['string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'       => 'পণ্যের নাম দিন।',
            'category.required'   => 'পণ্যের বিভাগ নির্বাচন করুন।',
            'price_bdt.required'  => 'পণ্যের মূল্য দিন।',
            'stock_quantity.required' => 'স্টক পরিমাণ দিন।',
            'images.max'          => 'সর্বোচ্চ ৬টি ছবি দেওয়া যাবে।',
        ];
    }
}
