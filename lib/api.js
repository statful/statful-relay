var logger = require('./logger'),
    strats = require('./strats'),
    influx = require('./influx08'),
    elasticsearch = require('elasticsearch'),
    SimpleCache = require("simple-lru-cache"),
    querystring = require("querystring"),
    http = require('http'),
    async = require('async'),
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

function backendHosts(backends) {
    var hosts = [];
    backends.forEach(function (host) {
        hosts.push({
            'host': host.host,
            'port': host.port,
            'db_name': host.prefix,
            'db_created': false
        });
    });

    return hosts;
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

        l = logger.init(config, module);
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

            var validDestinations = filterValidHosts(destinations.hosts);

            if (validDestinations) {
                strats.handleWrite(destinations.writeStrategy,
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

        l = logger.init(config, module);

        var destinations = {};

        for (var account_key in config.accounts) {
            var account = config.accounts[account_key],
                influxdbInfo = account.backends['metrics-influxdb'];

            if (influxdbInfo) {
                destinations[influxdbInfo.prefix] = {
                    'writeStrategy': influxdbInfo.write,
                    'hosts': backendHosts(influxdbInfo.hosts)
                };

                strats.handleWrite(destinations[influxdbInfo.prefix].writeStrategy,
                    destinations[influxdbInfo.prefix].hosts,
                    influx.createDB,
                    [ influxdbInfo.prefix, l ]
                );
            }
        }

        l.info("Indexation of TEL accounts by Account Key. Found " + Object.keys(destinations).length + " configuration(s)");

        return destinations;
    }


};