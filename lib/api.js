var logger = require('./logger'),
    elasticsearch = require('elasticsearch'),
    SimpleCache = require("simple-lru-cache"),
    cache,
    l;

module.exports = {

    processMetricLine: function (config) {

        l = new logger.Logger(config.log || {});
        l.log("Tagger up and running on " + config.port);

        cache = new SimpleCache({"maxSize": config.cache.maxSize});


        var createIndex = function (destination, tenant, callback) {
            if (!cache.get(tenant)) {
                l.log("Tenant [" + tenant + "] not in cache. Attempting to create index", "INFO");
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
                        l.log("Failed to create index [" + destination.index_name + "] for tenant [" + tenant + "]: " + error, "ERROR");
                    } else {
                        l.log("Created index [" + destination.index_name + "] for tenant: " + tenant, "INFO");
                        cache.set(tenant, true);
                        callback();
                    }
                });
            } else {
                callback();
            }
        };

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

        var processMetricLine = function(metric) {
            var tenant = metric.split(".")[0],
                destination = config.destinations[tenant];

            if (destination) {
                createIndex(destination, tenant, function () {
                    indexMetric(metric, destination);
                });
            }
        };

        return function _processMetricLines(lines) {

            if (!config.destinations) {
                l.log("Destinations are unavailable.", "ERROR§");
                return;
            }

            if (lines && typeof lines === "string") {
                var line_parts;
                line_parts = lines.split(" ");
                for (var i in line_parts) {
                    processMetricLine(line_parts[i]);
                }
            }
        };
    },


    indexDestinations: function (config) {

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
                    'index_name': account_key + "-metrics"
                };
            }
        }

        l.log("Indexation of TEL accounts by Elastic Search endpoints completed. Found " + Object.keys(destinations).length + " configuration(s) and " + Object.keys(clients).length + " destination(s).", "INFO");

        return destinations;
    }
};