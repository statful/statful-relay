var udp = require('./udp');

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
function dispatchMetricLine(config, telemetron) {
    return function (lines) {
        lines = lines.toString();

        if (lines && typeof lines === 'string') {
            var linesList = lines.split('\n');
            linesList.forEach(function (metricLine) {
                telemetron.putRaw(metricLine);
            });

            if (config.autoDiagnostics) {
                telemetron.inc('metrics_flushed', countMetricsInLines(lines));
            }
        }
    };
}

/**
 * Constructor for the Telemetron relay server.
 *
 * @param config A configuration object
 * @param telemetron An instance of Telemetron client to send metrics
 * @constructor
 */
var Relay = function (config, telemetron) {
    this.config = config;
    this.telemetron = telemetron;
};

/**
 * Starts the UDP Telemetron Relay server
 */
Relay.prototype.start = function () {
    var udpConfig = this.config.udpRelay;
    udp.start(udpConfig.port, udpConfig.address, udpConfig.ipv6,
        dispatchMetricLine(this.config, this.telemetron));
};

/**
 * Stops the UDP Telemetron Relay server
 */
Relay.prototype.stop = function () {
    udp.stop();
};

module.exports = Relay;