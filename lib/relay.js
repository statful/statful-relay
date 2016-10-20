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
    this.logger = Logger.sharedLogger(loadedConfig).child({file: Util.getCurrentFile(module)}, true);
};

/**
 * Starts the Statful Relay
 */
Relay.prototype.start = function () {
    this.statfulListener = new StatfulListener(this.config.listeners.statful, this.statful);
    this.statfulListener.start();
};

/**
 * Stops the Statful Relay
 */
Relay.prototype.stop = function () {
    this.statfulListener.stop();
};

module.exports = Relay;