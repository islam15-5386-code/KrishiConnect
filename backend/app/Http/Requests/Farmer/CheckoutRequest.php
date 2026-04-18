<?php

namespace App\Http\Requests\Farmer;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'items'                    => ['required', 'array', 'min:1'],
            'items.*.product_id'       => ['required', 'integer', 'exists:marketplace_products,id'],
            'items.*.quantity'         => ['required', 'integer', 'min:1'],
            'delivery_address'         => ['required', 'string', 'min:10'],
            'delivery_district'        => ['sometimes', 'string'],
            'payment_method'           => ['required', 'in:bkash,nagad,sslcommerz,cod'],
            'delivery_charge_bdt'      => ['sometimes', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'                => 'অন্তত একটি পণ্য নির্বাচন করুন।',
            'delivery_address.required'     => 'ডেলিভারি ঠিকানা দিন।',
            'payment_method.required'       => 'পেমেন্ট পদ্ধতি নির্বাচন করুন।',
            'items.*.product_id.exists'     => 'পণ্যটি পাওয়া যায়নি।',
        ];
    }
}
