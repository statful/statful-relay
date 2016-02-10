var udp = require('./udp');
var protocol = require("./collectd/collectd-protocol");

/**
 * Builds up a function to dispatch incoming collectd metrics.
 *
 * @returns {Function}
 */
function dispatchMetrics(telemetron, collectdApiSender) {
    return function (lines) {

        var parsedLines = protocol.decode(lines);
        var numberOfMetrics = parsedLines.length;

        var metrics = JSON.stringify(parsedLines);

        if (metrics && typeof metrics === 'string') {
            collectdApiSender.putRaw(metrics);
            telemetron.inc('metrics_flushed', numberOfMetrics);
        }
    };
}

/**
 * Constructor for the Telemetron Collectd Relay server.
 *
 * @param config A configuration object
 * @param telemetron A Telemetron client instance to send Relay telemetry
 * @param collectdApiSender A telemetron client instance for sending collectd
 * @constructor
 */
var CollectdRelay = function (config, telemetron, collectdApiSender) {
    this.config = config;
    this.telemetron = telemetron;
    this.collectdApiSender = collectdApiSender;
};

/**
 * Starts the UDP Telemetron Relay server for collectd metrics.
 */
CollectdRelay.prototype.start = function () {
    udp.start(this.config.port, this.config.address, this.config.ipv6,
        dispatchMetrics(this.telemetron, this.collectdApiSender));
};

/**
 * Stops the UDP Telemetron Relay server for collectd metrics.
 */
CollectdRelay.prototype.stop = function () {
    udp.stop();
};

module.exports = CollectdRelay;