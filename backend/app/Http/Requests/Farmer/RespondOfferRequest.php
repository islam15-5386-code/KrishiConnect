<?php

namespace App\Http\Requests\Farmer;

use Illuminate\Foundation\Http\FormRequest;

class RespondOfferRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'action'            => ['required', 'in:accept,reject,counter'],
            'counter_price_bdt' => ['required_if:action,counter', 'numeric', 'min:1'],
            'note'              => ['sometimes', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'action.required'                  => 'সিদ্ধান্ত নির্বাচন করুন: accept/reject/counter।',
            'counter_price_bdt.required_if'    => 'পাল্টা দাম দিন।',
        ];
    }
}
