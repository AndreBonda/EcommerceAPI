const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const schemaValidation = require('../utility/models_utility/schemaValidation');

const dbSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
        maxlength: 50
    },
    description: {
        type: String,
        minlength: 1,
        maxlength: 50
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0,
        max: 99999,
        set: v => Math.round((v + Number.EPSILON) * 1e2) / 1e2
    },
    discountPrice: {
        type: Number,
        required: true,
        min: 0,
        max: 99999,
        set: v => Math.round((v + Number.EPSILON) * 1e2) / 1e2
    },
    discountPercentage: {
        type: Number,
        min: 1,
        max: 99,
        set: function (v) {
            if (v) {
                return Math.round(v)
            }
        }
    },
    insert: {
        type: Date,
        required: true
    },
    modified: {
        type: Date
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    category: {
        type: mongoose.Types.ObjectId,
        required: true
    }
});

dbSchema.statics.validate = function (product) {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .min(1)
            .max(50),
        description: Joi.string()
            .min(1)
            .max(50),
        basePrice: Joi.number()
            .required()
            .min(0)
            .max(99999),
        discountPrice: Joi.number()
            .min(0)
            .max(product.basePrice),
        discountPercentage: Joi.number()
            .integer()
            .min(1)
            .max(99),
        categoryId: Joi.objectId()
            .required(),
    }).nand('discountPrice', 'discountPercentage');

    const { error } = schema.validate(product);
    return schemaValidation(error);
}

dbSchema.statics.validateApplyDiscount = function (discountParams) {
    const schema = Joi.object({
        basePrice: Joi.number()
            .required()
            .min(0)
            .max(99999),
        discountPrice: Joi.number()
            .min(0)
            .max(discountParams.basePrice),
        discountPercentage: Joi.number()
            .integer()
            .min(1)
            .max(99)
    }).xor('discountPrice', 'discountPercentage');

    const { error } = schema.validate(discountParams);
    return schemaValidation(error);
}

module.exports = mongoose.model('Products', dbSchema);