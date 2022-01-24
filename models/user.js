const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');
const Joi = require('joi');
const schemaValidation = require('../utility/models_utility/schemaValidation');

const dbSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 255,
        unique: true,
        validate: {
            validator: function (v) {
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: 'Invalid email'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    },
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50
    },
    surname: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 50
    },
    address: {
        type: String,
        minlength: 1,
        maxlength: 50
    },
    birthday: {
        type: Date
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    insert: {
        type: Date,
        required: true
    },
    modified: {
        type: Date
    }
});

// Instance methods
dbSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('jwtSecretKey'));
    return token;
}

// Static methods
dbSchema.statics.validate = function (user) {
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2 })
            .required()
            .min(1)
            .max(255),
        name: Joi.string()
            .alphanum()
            .required()
            .min(1)
            .max(50),
        surname: Joi.string()
            .alphanum()
            .required()
            .min(1)
            .max(50),
        address: Joi.string()
            .alphanum()
            .min(1)
            .max(50),
        birthday: Joi.date()
            .greater('1-1-1900'),
        password: Joi.string()
            .required()
            .min(5)
            .max(30)
            .pattern(/[A-Z]/, 'Password must contain an upper case character')
            .pattern(/[a-z]/, 'Password must contain a lower case character')
            .pattern(/[0-9]/, 'Password must contain a number')
            .pattern(/[:;}%!*\\|:{~#<#^]/, 'Password must contain a symbol. \n : ; } % ! * \ | : { ~ # < # ^'),
        isAdmin: Joi.boolean()
    });

    const { error } = schema.validate(user);
    return schemaValidation(error);
}

dbSchema.statics.validateAuthentication = function (params) {
    const schema = Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2 })
            .required()
            .min(1)
            .max(255),
        password: Joi.string()
            .required()
            .min(5)
            .max(30)
    });

    const { error } = schema.validate(params);
    return schemaValidation(error);
}


module.exports = mongoose.model("Users", dbSchema);