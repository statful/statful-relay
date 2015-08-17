var logger = require('./logger'),
    influx = {
        '0.8': require('./influx08'),
        '0.9': require('./influx09')
    },
    elasticsearch = require('elasticsearch'),
    SimpleCache = require("simple-lru-cache"),
    querystring = require("querystring"),
    http = require('http'),
    async = require('async'),
    strategies = require('node-cluster-io-strategy'),
    cache,
    l;

function filterValidHosts(hosts) {
    async.filterSeries(hosts,
        function (item, itemCallback) {
            if (item.db_created) {
                itemCallback(true);
            } else {
                itemCallback(false);
            }
        },
        function (results) {
            return results
        }
    );
}

function clusterHosts(hosts) {
    var clusterHosts = [];
    hosts.forEach(function (host) {
        clusterHosts.push({
            'host': host.host,
            'port': host.port,
            'db_name': host.prefix,
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

        var l = logger.init(config, module),
            version = config.influxdbVersion || '0.8';

        l.info("InfluxDB Writer up and running on " + config.port);

        var processMetricLine = function (metric) {
            var prefix = metric.split(".")[0],
                destination = config.destinations[prefix],
                metric_parts;

            if (destination && destination.db_created) {
                metric_parts = metric.split(" ");

                influx[version].flushMetrics(destination, [{
                    "name": metric_parts[0],
                    "columns": ["time", "value"],
                    "points": [
                        [parseFloat(metricParts[2]) * 1000, parseFloat(metricParts[1])]
                    ]
                }];

            var validDestinations = filterValidHosts(destinations.hosts);

            if (validDestinations) {
                strategies.handleIO(destinations.writeStrategy,
                    validDestinations,
                    influx.flushMetrics,
                    [ metric, l ]
                );
            }
        };

        return function _processMetricLines(lines) {

            if (!config.destinations) {
                l.error("Destinations are unavailable.");
                return;
            }

            if (lines && typeof lines === "string") {
                lines.split("\n").forEach(function (metric) {
                    processMetricLine(metric);
                });
            }
        };
    },


    indexDestinations: function (config) {

        var l = logger.init(config, module),
            version = config.influxdbVersion || '0.8',
            destinations = {};

        for (var account_key in config.accounts) {
            var account = config.accounts[account_key],
                influxdbInfo = account.clusters['metrics-influxdb'];

            if (influxdbInfo) {
                destinations[influxdbInfo.prefix] = {
                    'writeStrategy': influxdbInfo.write,
                    'hosts': clusterHosts(influxdbInfo.hosts)
                };

                strategies.handleIO(destinations[influxdbInfo.prefix].writeStrategy,
                    destinations[influxdbInfo.prefix].hosts,
                    influx[version].createDB,
                    [ influxdbInfo.prefix, l ]
                );
            }
        }

        l.info("Indexation of TEL accounts by Account Key. Found " + Object.keys(destinations).length + " configuration(s)");

        return destinations;
    }


};