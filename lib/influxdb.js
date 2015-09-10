var logger = require('./logger'),
    strategies = require('node-cluster-io-strategy'),
    querystring = require('querystring'),
    http = require('http'),
    utils = require('./utils'),
    buffer = {},
    timer = {},
    l;


/**
 * Creates the InfluxDB Database
 *
 * @param destination
 * @param account
 * @param logger
 */
function createDB(destination, account, logger) {
    l.info('Attempting to create DB [' + destination.db_name + '] ');

    var options = {
        hostname: destination.host,
        port: destination.port,
        method: 'GET',
        path: '/query?' + querystring.stringify({'q': 'CREATE DATABASE ' + destination.db_name})
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');
        var responseText = '';

        res.on('data', function (body) {
            responseText += body;
        });

        res.on('end', function () {
            // Mark the DB as created if the Response Code is: Created or Conflict
            if (this.statusCode === 200 || this.statusCode === 201 || this.statusCode === 409) {
                destination.db_created = true;
                logger.info('Created DB [' + destination.db_name + '] on Host:' + destination.host);
            }
        });
    });

    req.end();
}

function flushBufferedMetrics(bufferName, destination) {
    var options = {
            hostname: destination.host,
            port: destination.port,
            method: 'POST',
            path: '/write?rp=default&precision=s&db=' + destination.db_name
        },
        flushLines;

    if (buffer[bufferName].length > 0) {
        flushLines = buffer[bufferName];

        // delete the buffer
        buffer[bufferName] = 0;

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var responseText = '';

            res.on('data', function (body) {
                responseText += body;
            });

            res.on('end', function () {

                l.debug(bufferName + ': flushed metrics: ' + flushLines.join("\n"));

                if (this.statusCode === 200 || this.statusCode === 204) {
                    l.debug(bufferName + ': flushed metrics: ' + flushLines.length);
                } else {
                    l.error(bufferName + ': error flushing metrics: ' + responseText);
                }
            });

            req.on('error', function (e) {
                console.log(bufferName + ': problem with request: ' + e.message);
            });
        });

        req.write(flushLines.join('\n'));
        req.end();
    } else {
        // delete the timer if there is nothing to flush
        l.info(bufferName + ': removing buffer and timer because it is empty');
        clearInterval(timer[bufferName]);
        delete(timer[bufferName]);
        delete(buffer[bufferName]);
    }
}

/**
 * Writes the metrics held in memory to InfluxDB
 *
 * @param destination
 * @param metrics
 */
function flushMetrics(destination, metrics) {
    var bufferName = ['buffer', destination.db_name, destination.host, destination.port].join('.'),
        flushLines = metrics.map(function (m) {
            return m.points.map(function (p) {
                // make sure the number always has decimal places. this is because once a value is sent
                // to influxdb with decimal cases, it won't accept values without it
                p[1] = p[1] % 1 ? p[1] : parseFloat(p[1]).toFixed(1);
                return m.name + ' value=' + p[1] + ' ' + p[0];
            });
        });

    if (!buffer[bufferName]) {
        buffer[bufferName] = [];
    }

    if (flushLines.length > 0) {
        if (buffer[bufferName].length > destination.maxBufferSize) {
            l.error(bufferName + ': discarding ' + flushLines.length + ' metrics because of buffer overflow. Current buffer size: ' + buffer[bufferName].length);
        } else {
            buffer[bufferName] = buffer[bufferName].concat(flushLines);
            l.debug(bufferName + ': current buffer size: ' + buffer[bufferName].length);
        }
    }

    if (!timer[bufferName]) {
        timer[bufferName] = setInterval(flushBufferedMetrics, destination.flushInterval, bufferName, destination);
    }


}

/**
 * Reads the Accounts configuration and builds up the destination clients. This includes triggering the
 * InfluxDB database creation on all cluster nodes
 *
 * @param config
 * @returns {{}}
 */
function indexDestinations(config) {

    var destinations = {};

    l = logger.init(config, module);

    for (var account_key in config.accounts) {
        var account = config.accounts[account_key],
            influxDBInfo = account.clusters['metrics-influxdb'];

        if (influxDBInfo) {
            destinations[influxDBInfo.prefix] = {
                'writeStrategy': influxDBInfo.write,
                'prefix': influxDBInfo.prefix,
                'hosts': utils.clusterHosts(influxDBInfo.hosts, influxDBInfo.prefix + config.influxdb.suffix,
                    config.influxdb.flushInterval, config.influxdb.maxBufferSize)
            };
            strategies.handleIO(destinations[influxDBInfo.prefix].writeStrategy,
                destinations[influxDBInfo.prefix].hosts,
                createDB,
                [influxDBInfo.prefix, l]
            );
        }
    }

    l.info('Indexation of TEL accounts by Account Key. Found ' + Object.keys(destinations).length + ' configuration(s)');

    return destinations;
}

module.exports = {

    createDB: createDB,

    flushMetrics: flushMetrics,

    indexDestinations: indexDestinations

};