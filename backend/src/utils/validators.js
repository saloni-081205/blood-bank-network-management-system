const { body } = require('express-validator');

const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

// Reusable phone validator
const phoneValidator = (field = 'phone') =>
    body(field)
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(PHONE_REGEX).withMessage(
            'Phone must be 10 digits starting with 6-9 (optional +91 prefix)'
        );

// Reusable optional phone validator (for hospital contact_number etc.)
const optionalPhoneValidator = (field) =>
    body(field)
        .optional({ checkFalsy: true })
        .trim()
        .matches(PHONE_REGEX).withMessage(
            'Phone must be 10 digits starting with 6-9 (optional +91 prefix)'
        );

module.exports = { phoneValidator, optionalPhoneValidator, PHONE_REGEX };