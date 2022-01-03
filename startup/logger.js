/**
 * It's configured only as developer logger for writing in console because this is an application test. It is not released in production
 */

const winston = require('winston');

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
