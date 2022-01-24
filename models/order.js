const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const schemaValidation = require('../utility/models_utility/schemaValidation');

const dbSchema = new mongoose.Schema({
    address: {
        type: String,
        minlength: 1,
        maxlength: 50
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
        max: 99999,
        set: v => Math.round((v + Number.EPSILON) * 1e2) / 1e2
    },
    status: {
        type: String,
        enum: ['booked', 'shipped', 'completed'],
        lowercase: true,
        required: true
    },
    products: [
        new mongoose.Schema({
            price: {
                type: Number,
                required: true,
                min: 0,
                max: 99999,
                set: v => Math.round((v + Number.EPSILON) * 1e2) / 1e2
            },
            name: {
                type: String,
                required: true,
                minlength: 1,
                maxlength: 50
            },
            description: {
                type: String,
                minlength: 1,
                maxlength: 50
            },
            quantity: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
                set: v => Math.round(v)
            }
        })
    ],
    insert: {
        type: Date,
        required: true
    },
    modify: {
        type: Date
    },
    user: {
        type: mongoose.Types.ObjectId,
        required: true
    }
});

dbSchema.statics.validatePostOrder = function (params) {
    const schema = Joi.object({
        address: Joi.string()
            .required()
            .min(1)
            .max(50),
        status: Joi.string()
            .valid('booked', 'shipped', 'completed'),
        products: Joi.array()
            .items(
                Joi.object({
                    id: Joi.objectId()
                        .required(),
                    quantity: Joi.number()
                        .required()
                        .min(1)
                })
            )
            .required()
            .min(1)
    });

    const { error } = schema.validate(params);
    return schemaValidation(error);
};

module.exports = mongoose.model('Orders', dbSchema);