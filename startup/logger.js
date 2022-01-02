const winston = require('winston');

/**
 * I configured only a developer logger for writing in console because this is an application test. It will not released in production
 */

module.exports = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: "info",
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            )
        })
    ],
    exceptionHandlers: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
            )
        })
    ]
});
