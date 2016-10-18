var udp = require('./listeners/udp');

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
function dispatchMetricLine(systemStats, statful) {
    return function (lines) {
        lines = lines.toString();

        if (lines && typeof lines === 'string') {
            var linesList = lines.split('\n');
            linesList.forEach(function (metricLine) {
                statful.putRaw(metricLine);
            });

            if (systemStats) {
                statful.counter('metrics_flushed', countMetricsInLines(lines));
            }
        }
    };
}

/**
 * Constructor for the Statful relay server.
 *
 * @param config A configuration object
 * @param systemStats
 * @param statful An instance of Statful client to send metrics
 * @constructor
 */
var Relay = function (config, systemStats, statful) {
    this.config = config;
    this.systemStats = systemStats;
    this.statful = statful;
};

/**
 * Starts the UDP Statful Relay server
 */
Relay.prototype.start = function () {
    udp.start(this.config.port, this.config.address, this.config.ipv6,
        dispatchMetricLine(this.systemStats, this.statful));
};

/**
 * Stops the UDP Statful Relay server
 */
Relay.prototype.stop = function () {
    udp.stop();
};

module.exports = Relay;