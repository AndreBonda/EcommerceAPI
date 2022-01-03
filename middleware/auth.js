/**
 * This middleware checks if the request contains a valid token.
 */

const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function auth(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('No token provided');

    try {
        const decodedPayload = jwt.verify(token, config.get('jwtSecretKey'));
        // add user in request obj
        req.user = decodedPayload;
        next();
    } catch {
        return res.status(400).send('Invalid token');
    }
}