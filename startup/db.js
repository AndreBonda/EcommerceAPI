const logger = require("./logger");
const config = require("config");
const mongoose = require("mongoose");

module.exports = function () {
    const connectionString = config.get('connectionString');
    mongoose.connect(connectionString)
        .then(() => logger.info(`Connected to ${connectionString}...`));
}
