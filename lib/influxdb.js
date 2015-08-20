var influx = {
        '0.9': require('./influx09')
    },
    logger = require('./logger'),
    strategies = require('node-cluster-io-strategy');


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

function createDB (destination, account, logger) {
    return influx[destination.version] ? influx[destination.version].createDB(destination, account, logger) : false;
}

function flushMetrics(destination, metrics, logger) {
    return influx[destination.version] ? influx[destination.version].flushMetrics(destination, metrics, logger) : false;
}

function indexDestinations(config) {

    var l = logger.init(config, module),
        destinations = {};

    for (var account_key in config.accounts) {
        var account = config.accounts[account_key],
            influxdbInfo = account.clusters['metrics-influxdb'];

        if (influxdbInfo) {
            destinations[influxdbInfo.prefix] = {
                'writeStrategy': influxdbInfo.write,
                'hosts': clusterHosts(influxdbInfo.hosts, influxdbInfo.prefix + config.influxdbSufix)
            };
            strategies.handleIO(destinations[influxdbInfo.prefix].writeStrategy,
                destinations[influxdbInfo.prefix].hosts,
                createDB,
                [influxdbInfo.prefix, l]
            );
        }
    }

    l.info("Indexation of TEL accounts by Account Key. Found " + Object.keys(destinations).length + " configuration(s)");

    return destinations;
}

module.exports = {

    createDB: createDB,

    flushMetrics: flushMetrics,

    indexDestinations: indexDestinations

};