var logger = require('./logger'),
    elasticsearch = require('elasticsearch'),
    SimpleCache = require("simple-lru-cache"),
    cache,
    l,
    splitMetricsRegexp;

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
        l.log("Tagger up and running on " + config.port);

        cache = new SimpleCache({"maxSize": config.cache.maxSize});
        splitMetricsRegexp = new RegExp('/\s+$/g');


        var indexMetric = function (metric_key, destination) {
            // if the metric is not yet in the cache, then go ahead and index it :-)
            if (!cache.get(metric_key)) {
                destination.client.index({
                    index: destination.index_name,
                    type: 'metric',
                    id: metric_key,
                    body: {
                        key: metric_key,
                        tags: []
                    }
                }, function (error, response) {
                    if (error) {
                        l.log("Failed to index metric key: " + metric_key + ". Error: " + error, "ERROR");
                    } else {
                        l.log("Successfully indexed metric: " + metric_key, "DEBUG");
                    }
                });

                cache.set(metric_key, true);
            }
        };

        var processMetricLine = function (metric) {
            var account = metric.split(".")[0],
                destination = config.destinations[account];

            if (destination && destination.index_created) {
                indexMetric(metric, destination);
            }
        };

        return function _processMetricLines(lines) {

            if (!config.destinations) {
                l.log("Destinations are unavailable.", "ERROR");
                return;
            }

            if (lines && typeof lines === "string") {
                lines.split(/\s/g).forEach(function (metric) {
                    processMetricLine(metric);
                });
            }
        };
    },


    /**
     * Builds up the the indexes for the destinations found in the configuration.
     * This includes setting up the Elasticseach Clients and creating the Indexes for each account.
     *
     * @param config
     * @returns {{}}
     */
    indexDestinations: function (config) {

        var createIndex = function (destination, account) {

            l.log("Account [" + account + "] not in cache. Attempting to create index", "INFO");
            destination.client.indices.create({
                index: destination.index_name,
                body: {
                    "mappings": {
                        "metric": {
                            "properties": {
                                "key": {
                                    "type": "string",
                                    "analyzer": "metric_name"
                                }
                            }
                        }
                    },
                    "settings": {
                        "analysis": {
                            "analyzer": {
                                "metric_name": {
                                    "type": "pattern",
                                    "pattern": "\\.+"
                                }
                            }
                        }
                    }
                }
            }, function (error, response) {
                if (error
                    && !(error.message && error.message == "IndexAlreadyExistsException[[" + destination.index_name + "] already exists]")) {
                    // fonsecaj: so far, this is the only way I was able to detect if the failure was not because the index already existed
                    // we should only trigger this error if the index creation failed for some other reason.
                    l.log("Failed to create index [" + destination.index_name + "] for account [" + account + "]: " + error, "ERROR");
                    destination.index_created = false;
                } else {
                    l.log("Created index [" + destination.index_name + "] for account: " + account, "INFO");
                    destination.index_created = true;
                }
            });
        };

        l = new logger.Logger(config.log || {});

        var destinations = {},
            clients = {};

        for (var account_key in config.accounts) {
            var account = config.accounts[account_key],
                es_info = account.backends['search-elasticsearch'];

            if (es_info) {
                var host = es_info.host + ':' + es_info.port,
                    client = clients[host];
                if (!client) {
                    client = new elasticsearch.Client({
                        host: es_info.host + ':' + es_info.port + "/es",
                        log: (config.es || {log: 'trace'}).log
                    });
                    clients[host] = client;
                }

                destinations[es_info.prefix] = {
                    'host': es_info.host,
                    'port': es_info.port,
                    'client': client,
                    'index_name': account_key + "-metrics",
                    'index_created': false
                };


                createIndex(destinations[es_info.prefix], account_key);
            }
        }

        l.log("Indexation of TEL accounts by Elastic Search endpoints completed. Found " + Object.keys(destinations).length + " configuration(s) and " + Object.keys(clients).length + " destination(s).", "INFO");

        return destinations;
    }


};