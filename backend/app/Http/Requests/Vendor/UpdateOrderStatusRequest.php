<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status'              => ['required', 'in:confirmed,dispatched,delivered,cancelled'],
            'cancellation_reason' => ['required_if:status,cancelled', 'nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required'                    => 'নতুন স্ট্যাটাস নির্বাচন করুন।',
            'cancellation_reason.required_if'    => 'বাতিলের কারণ উল্লেখ করুন।',
        ];
    }
}
