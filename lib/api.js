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

        l = new logger.Logger(config.log || {});
        l.log("InfluxDB Writer up and running on " + config.port);

        //cache = new SimpleCache({"maxSize": config.cache.maxSize});
        //
        //var indexMetric = function (metric_key, destination) {
        //    // if the metric is not yet in the cache, then go ahead and index it :-)
        //    if (!cache.get(metric_key)) {
        //        destination.client.index({
        //            index: destination.index_name,
        //            type: 'metric',
        //            id: metric_key,
        //            body: {
        //                key: metric_key,
        //                tags: []
        //            }
        //        }, function (error, response) {
        //            if (error) {
        //                l.log("Failed to index metric key: " + metric_key + ". Error: " + error, "ERROR");
        //            } else {
        //                l.log("Successfully indexed metric: " + metric_key, "DEBUG");
        //            }
        //        });
        //
        //        cache.set(metric_key, true);
        //    }
        //};

        var processMetricLine = function (metric) {
            var account = metric.split(".")[0],
                destination = config.destinations[account],
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
                l.log("Destinations are unavailable.", "ERROR");
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

        l = new logger.Logger(config.log || {});

        var destinations = {};

        for (var account_key in config.accounts) {
            var account = config.accounts[account_key],
                influxdb_info = account.backends['metrics-influxdb'];

            if (influxdb_info) {

                destinations[account_key] = {
                    'host': influxdb_info.host,
                    'port': influxdb_info.port,
                    'db_name': influxdb_info.prefix,
                    'db_created': false
                };

                influx.createDB(destinations[account_key], influxdb_info.prefix, l);
            }
        }

        l.log("Indexation of TEL accounts by Account Key. Found " + Object.keys(destinations).length + " configuration(s)", "INFO");

        return destinations;
    }


};