var UDP = require('../transport/udp');
var Logger = require('../logger');
var Utils = require('../utils');

/**
 * Counts the number of lines in the passed metrics lines
 *
 * @param metricLines A string containing lines of metrics
 * @returns {number}
 */
function countMetricsInLines(metricLines) {
    return metricLines.match(/\n/gi).length + 1;
}

/**
 * Builds up a function to dispatch incoming metrics
 *
 * @returns {Function}
 */
function dispatchMetricLine(listener) {
    return function (lines) {
        lines = lines.toString();

        if (lines && typeof lines === 'string') {
            var linesList = lines.split('\n');
            linesList.forEach(function (metricLine) {
                listener.statfulClient.putRaw(metricLine);
            });

            if (listener.config.stats) {
                listener.statfulClient.counter('metrics_flushed', countMetricsInLines(lines));
            }
        }
    };
}

/**
 * Constructor for the Relay Statful Listener.
 *
 * @param config A configuration object of the listener
 * @param statfulClient An instance of Statful client to send metrics
 * @constructor
 */
var StatfulListener = function (config, statfulClient) {
    this.config = config;
    this.statfulClient = statfulClient;
    this.udpTransport = null;
    this.logger = Logger.sharedLogger().child({file: Utils.getCurrentFile(module)}, true);
};

/**
 * Starts the Statful Listener
 */
StatfulListener.prototype.start = function () {
    var udpConfig = {
        port: this.config.port,
        address: this.config.address,
        ipv6: this.config.ipv6
    };
    this.logger.info('Listener for statful metrics will start.');
    this.udpTransport = new UDP(udpConfig, dispatchMetricLine(this));
    this.udpTransport.start();
};

/**
 * Stops the Statful Listener
 */
StatfulListener.prototype.stop = function () {
    this.udpTransport.stop();
    this.logger.info('Listener for statful metrics has been stopped.');
};

module.exports = StatfulListener;