var restify = require('restify'),
    async = require('async'),
    logger = require('./logger'),
    influx = require('./influxdb'),
    strategies = require('node-cluster-io-strategy'),
    cache = {};

/**
 * Creates an HTTP Server to ingest CollectD metrics and send them to InfluxDB
 *
 * @param config
 */
function createServer(config) {

    var l = logger.init(config, module);

    // create restify server
    var server = restify.createServer({
        name: (config.collectd.serverName || 'CollectD Proxy'),
        url: (config.collectd.url || 'localhost')
    });

    // configure 'interceptors'
    server.use(restify.queryParser());
    server.use(restify.bodyParser());

    // Elastic search proxies
    server.post(/^\/(.*)/, processRequest(config));

    // binds the server
    server.listen((config.collectd.port || 8080), function listenServer() {
        l.info(server.name + ' listening at ' + server.url);
    });
}


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
function processRequest(config) {

    var l = logger.init(config, module);

    return function _processRequest(request, response, next) {
        var metrics = [],
            url = request.url.replace('/', '').split('/'), // parse the incoming url - this is needed because the request.params gets overridden by collectd data
            prefix = url[0],
            destination = config.destinations[prefix];

        try {

            if (destination) {
                if (request.body) {
                    request.body.map(function (record) {
                        record.dsnames.map(function (dsname, i) {
                            var metric_name = [],
                                value = parseFloat(record.values[i]),
                                key,
                                readyToPush = false;

                            if (!isNaN(value)) {
                                metric_name.push(record.plugin);
                                if (url[1]) {
                                    metric_name.push(url[1]);
                                }
                                metric_name.push("host=" + record.host);
                                if (record.plugin_instance !== undefined) {
                                    metric_name.push("plugin_instance=" + record.plugin_instance);
                                }
                                if (record.type !== undefined) {
                                    metric_name.push("type=" + record.type);
                                }
                                if (record.interval !== undefined) {
                                    metric_name.push("interval=" + record.interval);
                                }
                                if (record.type_instance !== undefined && record.type_instance !== '') {
                                    metric_name.push("type_instance=" + record.type_instance);
                                } else {
                                    metric_name.push("type_instance=" + dsname);
                                }

                                key = metric_name.join(",");
                                if (['counter', 'derive'].indexOf(record.dstypes[i]) >= 0) {
                                    if (cache[key] && !isNaN(cache[key].value) && record.time - cache[key].time > 0) {
                                        value = (value-cache[key].value) / (record.time - cache[key].time);
                                        readyToPush = true;
                                    }

                                    cache[key] = {
                                        value: value,
                                        time: record.time
                                    }
                                } else {
                                    readyToPush = true;
                                }


                                if (readyToPush) {
                                    metrics.push({
                                        "name": key,
                                        "columns": ["time", "value"],
                                        "points": [
                                            [parseFloat(record.time) * 1000, value.toFixed(2)]
                                        ]
                                    });
                                }
                            }
                        });
                    });

                    // flush metrics
                    filterValidHosts(destination.hosts, function (validDestinations) {
                        if (validDestinations) {
                            if (validDestinations.length != destination.hosts.length) {
                                l.warn("There are invalid destinations for: " + prefix + ". Expected " + destination.length + " but found " + validDestinations.length);
                            } else {
                                strategies.handleIO(destination.writeStrategy,
                                    validDestinations,
                                    influx.flushMetrics,
                                    [metrics, l]
                                );
                            }
                        } else {
                            l.warn("No valid destinations found for: " + prefix);
                        }
                    });
                }

                response.send(200);

            } else {
                return next(new restify.NotFoundError('Collector not found'));
            }
        } catch (e) {
            l.error('Exception: ' + e);
            return next(new restify.InternalError('Internal Server Error'));
        }
    };
}

module.exports = {

    createServer: createServer

};