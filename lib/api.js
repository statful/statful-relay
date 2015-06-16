var logger = require('./logger'),
    influx = require('./influx08'),
    elasticsearch = require('elasticsearch'),
    SimpleCache = require("simple-lru-cache"),
    querystring = require("querystring"),
    http = require('http'),
    cache,
    l;

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
                destination = config.destinations[prefix],
                metric_parts;

            if (destination && destination.db_created) {
                metric_parts = metric.split(" ");

                influx.flushMetrics(destination, [{
                    "name": metric_parts[0],
                    "columns": ["time", "value"],
                    "points": [
                        [parseFloat(metric_parts[2]) * 1000, parseFloat(metric_parts[1])]
                    ]
                }], l);
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
                influxdb_info = account.backends['metrics-influxdb'];

            if (influxdb_info) {

                destinations[influxdb_info.prefix] = {
                    'host': influxdb_info.host,
                    'port': influxdb_info.port,
                    'db_name': influxdb_info.prefix,
                    'db_created': false
                };

                influx.createDB(destinations[influxdb_info.prefix], influxdb_info.prefix, l);
            }
        }

        l.info("Indexation of TEL accounts by Account Key. Found " + Object.keys(destinations).length + " configuration(s)");

        return destinations;
    }


};