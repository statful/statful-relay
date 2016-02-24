var udp = require('./udp');
var collectd = require('collectd-protocol');

/**
 * Builds up a function to dispatch incoming collectd metrics.
 *
 * @returns {Function}
 */
function dispatchMetrics(autoDiagnostics, telemetron, collectdApiSender) {
    return function (lines) {

        var metrics = collectd.decoder.decode(lines);

        if (Array.isArray(metrics)) {
            metrics.forEach(function (metric) {
                collectdApiSender.putRaw(metric);
            });

            if (autoDiagnostics && metrics.length > 0) {
                telemetron.inc('metrics_flushed', metrics.length);
            }
        }
    };
}

/**
 * Constructor for the Telemetron Collectd Relay server.
 *
 * @param config A configuration object
 * @param autoDiagnostics
 * @param telemetron A Telemetron client instance to send Relay telemetry
 * @param collectdApiSender A telemetron client instance for sending collectd
 * @constructor
 */
var CollectdRelay = function (config, autoDiagnostics, telemetron, collectdApiSender) {
    this.config = config;
    this.autoDiagnostics = autoDiagnostics;
    this.telemetron = telemetron;
    this.collectdApiSender = collectdApiSender;
};

/**
 * Starts the UDP Telemetron Relay server for collectd metrics.
 */
CollectdRelay.prototype.start = function () {
    udp.start(this.config.port, this.config.address, this.config.ipv6,
        dispatchMetrics(this.autoDiagnostics, this.telemetron, this.collectdApiSender));
};

/**
 * Stops the UDP Telemetron Relay server for collectd metrics.
 */
CollectdRelay.prototype.stop = function () {
    udp.stop();
};

module.exports = CollectdRelay;