<?php

namespace App\Http\Requests\Officer;

use Illuminate\Foundation\Http\FormRequest;

class RespondToTicketRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'response_text'                     => ['required', 'string', 'min:30'],
            'recommended_products'              => ['sometimes', 'array'],
            'recommended_products.*.name'       => ['required_with:recommended_products', 'string'],
            'recommended_products.*.category'   => ['sometimes', 'string'],
            'recommended_products.*.dosage'     => ['sometimes', 'string'],
            'resolution_timeline'               => ['sometimes', 'nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'response_text.required' => 'পরামর্শের বিবরণ দিন।',
            'response_text.min'      => 'পরামর্শ কমপক্ষে ৩০ অক্ষরের হতে হবে।',
        ];
    }
}
