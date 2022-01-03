const logger = require('../startup/logger');

module.exports = function (handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            logger.error(err.message, err);
            return res.status(500).send("Something failed");
        }
    }
}