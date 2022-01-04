/**
 * This middlware checks if id passed in a request id correct.
 */

const idValidation = require('mongoose').Types.ObjectId.isValid;

module.exports = function (req, res, next) {
    if (!req.params.id) return res.status(400).send('ID not provided.');

    if (!idValidation(req.params.id)) return res.status(400).send('Invalid ID.');
    next();
}