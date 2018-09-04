var StatfulListener = require('./listeners/statful');
var Logger = require('./logger');
var Utils = require('./utils');

/**
 * Constructor for the Statful Relay
 *
 * @param config A configuration object of the relay.
 * @param statful An instance of Statful client to send metrics.
 * @constructor
 */
var Relay = function (config, statful) {
    this.config = config;
    this.statful = statful;
    this.logger = Logger.sharedLogger(this.config).child({ file: Utils.getCurrentFile(module) }, true);
};

/**
 * Starts the Statful Relay
 */
Relay.prototype.start = function () {
    this.statfulListener = new StatfulListener(this.config.listeners.statful, this.statful);
    this.logger.info('Statful relay will start. All configured listeners will be created.');
    this.statfulListener.start();
};

/**
 * Stops the Statful Relay
 */
Relay.prototype.stop = function () {
    this.statfulListener.stop();
    this.logger.info('Statful relay has been stopped.');
};

module.exports = Relay;
