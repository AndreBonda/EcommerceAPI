/**
 * It process the result obtained from Joi module validation method.
 */

module.exports = errorValidation => {
    if (errorValidation) {
        return {
            result: false,
            message: errorValidation.details[0].message
        }
    } else {
        return {
            result: true
        }
    }
}