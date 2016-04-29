var udp = require('./udp');
var collectd = require('collectd-protocol');
var _ = require('lodash');

// Defined a custom string part to send tags through the collectd binary protocol
var customPartsConf = {
    0x0099: 'tags'
};

function toTagObject(arrayElement) {
    var tag = arrayElement.split('=');

    return { name: tag[0], value: tag[1] };
}

function mergeToObject(result, value) {
    (result[value.name] || (result[value.name] = [])).push(value.value);
    return result;
}

function toObjectArray(result, value, key) {
    result.push({ name: key, values: value });
    return result;
}

/**
 * Builds up a function to dispatch incoming collectd metrics.
 *
 * @returns {Function}
 */
function dispatchMetrics(autoDiagnostics, telemetron, collectdApiSender) {
    return function (lines) {

        var stream = collectd.decoder.decodeCustom(lines, customPartsConf);

        var metrics;

        stream.on('data', function (data) {
            metrics = data;
        }).on('end', function () {
            if (Array.isArray(metrics)) {
                metrics.forEach(function (metric) {

                    if (typeof metric.tags !== 'undefined') {
                        metric.tags = _.chain(metric.tags.split(','))
                            .map(toTagObject)
                            .reduce(mergeToObject, {})
                            .reduce(toObjectArray, [])
                            .value();
                    }

                    collectdApiSender.putRaw(metric);
                });

                if (autoDiagnostics && metrics.length > 0) {
                    telemetron.inc('metrics_flushed', metrics.length);
                }
            }
        }).on('error', function (error) {
            console.error(error);
        });
    };
}

/**
 * Constructor for the Telemetron Collectd Relay server.
 *
 * @param config A configuration object
 * @param autoDiagnostics
 * @param telemetron A Telemetron client instance to send Relay telemetry
 * @param collectdApiSender A telemetron client instance for sending collectd
 * @constructor
 */
var CollectdRelay = function (config, autoDiagnostics, telemetron, collectdApiSender) {
    this.config = config;
    this.autoDiagnostics = autoDiagnostics;
    this.telemetron = telemetron;
    this.collectdApiSender = collectdApiSender;
};

/**
 * Starts the UDP Telemetron Relay server for collectd metrics.
 */
CollectdRelay.prototype.start = function () {
    udp.start(this.config.port, this.config.address, this.config.ipv6,
        dispatchMetrics(this.autoDiagnostics, this.telemetron, this.collectdApiSender));
};

/**
 * Stops the UDP Telemetron Relay server for collectd metrics.
 */
CollectdRelay.prototype.stop = function () {
    udp.stop();
};

module.exports = CollectdRelay;