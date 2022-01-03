const express = require('express');
const logger = require('./startup/logger');

const app = express();

require("./startup/routes")(app);
require('./startup/db')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

module.exports = server;