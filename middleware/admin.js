/**
 * This middleware checks if the user is an admin.
 */

module.exports = function admin(req, res, next) {
    if (!req.user.isAdmin) return res.status(403).send('User must be an admin');
    next();
}