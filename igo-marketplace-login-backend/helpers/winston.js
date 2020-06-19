const winston = require('winston');
const {constants} = require('./constants');

/**
 * Configures winston logger for application
 */
const container = new winston.Container();
const {format} = winston;
const {combine, label, json} = format;
container.add(constants.logger, {
  format: combine(
    label({label: 'Igo-Marketplace-Login'}),	// Added to log lines, e.g. { ..., "label":"Igo-Marketplace-Login"}
    json()
  ),
  // "error" will always be logged to console
  transports: [new winston.transports.Console({level: 'info'})]
});

exports.logger = container.get(constants.logger);
