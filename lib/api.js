var logger = require('./logger'),
    influx = require('./influxdb'),
    async = require('async'),
    strategies = require('node-cluster-io-strategy');

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

function clusterHosts(hosts, db_name) {
    var clusterHosts = [];
    hosts.forEach(function (host) {
        clusterHosts.push({
            'host': host.host,
            'port': host.port,
            'db_name': db_name,
            'version': host.version,
            'db_created': false
        });
    });

    return clusterHosts;
}

module.exports = {

    /**
     * Takes in a configuration and builds up the function to
     * index the metrics received on Elasticsearch.
     *
     * @param config
     * @returns {Function}
     */
    processMetricLine: function (config) {

        var l = logger.init(config, module);

        l.info("InfluxDB Writer up and running on " + config.port);

        var processMetricLine = function (metric) {
            var prefix = metric.split(".")[0],
                destinations = config.destinations[prefix],
                metricParts = metric.split(" "),
                metric = [{
                    "name": metricParts[0],
                    "columns": ["time", "value"],
                    "points": [
                        [parseFloat(metricParts[2]) * 1000, parseFloat(metricParts[1])]
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
    },


    indexDestinations: function (config) {

        var l = logger.init(config, module),
            destinations = {};

        for (var account_key in config.accounts) {
            var account = config.accounts[account_key],
                influxdbInfo = account.clusters['metrics-influxdb'];

            if (influxdbInfo) {
                destinations[influxdbInfo.prefix] = {
                    'writeStrategy': influxdbInfo.write,
                    'hosts': clusterHosts(influxdbInfo.hosts, influxdbInfo.prefix)
                };

                strategies.handleIO(destinations[influxdbInfo.prefix].writeStrategy,
                    destinations[influxdbInfo.prefix].hosts,
                    influx.createDB,
                    [influxdbInfo.prefix, l]
                );
            }
        }

        l.info("Indexation of TEL accounts by Account Key. Found " + Object.keys(destinations).length + " configuration(s)");

        return destinations;
    }


};