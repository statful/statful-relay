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
function dispatchMetricLine(autoDiagnostics, telemetron) {
    return function (lines) {
        lines = lines.toString();

        if (lines && typeof lines === 'string') {
            var linesList = lines.split('\n');
            linesList.forEach(function (metricLine) {
                telemetron.putRaw(metricLine);
            });

            if (autoDiagnostics) {
                telemetron.inc('metrics_flushed', countMetricsInLines(lines));
            }
        }
    };
}

/**
 * Constructor for the Telemetron relay server.
 *
 * @param config A configuration object
 * @param autoDiagnostics
 * @param telemetron An instance of Telemetron client to send metrics
 * @constructor
 */
var Relay = function (config, autoDiagnostics, telemetron) {
    this.config = config;
    this.telemetron = telemetron;
};

/**
 * Starts the UDP Telemetron Relay server
 */
Relay.prototype.start = function () {
    udp.start(this.config.port, this.config.address, this.config.ipv6,
        dispatchMetricLine(this.autoDiagnostics, this.telemetron));
};

/**
 * Stops the UDP Telemetron Relay server
 */
Relay.prototype.stop = function () {
    udp.stop();
};

module.exports = Relay;