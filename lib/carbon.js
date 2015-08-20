var logger = require('./logger'),
    influx = require('./influxdb'),
    tcp = require('./tcp'),
    async = require('async'),
    strategies = require('node-cluster-io-strategy');


/**
 * Calculates the list of valid hosts based on them having had the InfluxDB created
 *
 * @param hosts
 * @param cb
 */
function filterValidHosts(hosts, cb) {
    async.filterSeries(hosts,
        function (item, itemCallback) {
            if (item.db_created) {
                itemCallback(true);
            } else {
                itemCallback(false);
            }
        },
        cb
    );
}


/**
 * Builds up a function to process incoming metrics
 *
 * @param config
 * @returns {Function}
 */
function processMetricLine(config) {

    var l = logger.init(config, module);

    l.info("InfluxDB Writer up and running on " + config.carbon.port);

    var processMetricLine = function (metric) {
        var prefix = metric.split(".")[0],
            destinations = config.destinations[prefix],
            metricParts = metric.split(" "),
            metric = [{
                "name": metricParts[0],
                "columns": ["time", "value"],
                "points": [
                    [parseFloat(metricParts[2]) * 1000, parseFloat(metricParts[1]).toFixed(2)]
                ]
            }];

        if (destinations) {
            filterValidHosts(destinations.hosts, function (validDestinations) {
                if (validDestinations) {
                    if (validDestinations.length != destinations.hosts.length) {
                        l.warn("There are invalid destinations for: " + prefix + ". Expected " + destinations.length + " but found " + validDestinations.length);
                    } else {
                        strategies.handleIO(destinations.writeStrategy,
                            validDestinations,
                            influx.flushMetrics,
                            [metric, l]
                        );
                    }
                } else {
                    l.warn("No valid destinations found for: " + prefix);
                }
            });
        } else {
            l.warn("Received metric for unknown destination: " + metricParts[0]);
        }
    };

    return function _processMetricLines(lines) {

        if (!config.destinations) {
            l.error("Destinations are unavailable.");
            return;
        }

        if (lines && typeof lines === "string") {
            lines.split("\n").forEach(function (metric) {
                if (metric) {
                    processMetricLine(metric);
                }
            });
        }
    };
}

module.exports = {

    createServer: function(config) {
        tcp.start(config.carbon.port, config.carbon.host, processMetricLine(config));
    }
};