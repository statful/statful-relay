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

        return function _processMetricLine(line) {

            var line_pieces = line.split(" "),
                metric_key = line_pieces[0];

            if (!config.destinations) {
                l.log("Destinations index unavailable. Ignoring metric " + metric_key + ".", "DEBUG");
                return;
            }

            var metric_key_pieces = metric_key.split("."),
                metric_tenant = metric_key_pieces[0],
                destination = config.destinations[metric_tenant];

            if (!destination) {
                l.log("Received metrics related to non existing tenant " + metric_tenant + ". Ignoring it.", "INFO");
                return;
            }


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
            /*destination.client.bulk({
             body: [
             // action description
             { index:  { _index: index_name, _type: 'metric', _id:  } },
             // the document to index
             { title: 'foo' },
             // action description
             { update: { _index: 'myindex', _type: 'mytype', _id: 2 } },
             // the document to update
             { doc: { title: 'foo' } },
             // action description
             { delete: { _index: 'myindex', _type: 'mytype', _id: 3 } },
             // no document needed for this delete
             ]
             }, function (err, resp) {
             // ...
             });*/
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