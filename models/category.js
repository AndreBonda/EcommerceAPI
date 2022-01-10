const mongoose = require("mongoose");
const Joi = require('joi');
const schemaValidation = require('../utility/models_utility/schemaValidation');

const dbSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
        maxlength: 50
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
    }
});

// Static methods
dbSchema.statics.validate = function (category) {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .min(1)
            .max(50),
    });

    const { error } = schema.validate(category);
    return schemaValidation(error);
}

module.exports.Category = mongoose.model("Categories", dbSchema);
module.exports.categorySchema = dbSchema;