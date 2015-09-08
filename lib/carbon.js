var logger = require('./logger'),
    influx = require('./influxdb'),
    tcp = require('./server/tcp'),
    udp = require('./server/udp'),
    utils = require('./utils'),
    strategies = require('node-cluster-io-strategy');




/**
 * Builds up a function to process incoming metrics
 *
 * @param config
 * @returns {Function}
 */
function processMetricLine(config) {

    var l = logger.init(config, module);

    var processMetricLine = function (metric) {
        var extractMetricPrefix = metric.split('.'),
            prefix = extractMetricPrefix.shift(),
            destinations = config.destinations[prefix],
            metricParts = extractMetricPrefix.join('.').split(' '),
            metric = [{
                'name': metricParts[0],
                'columns': ['time', 'value'],
                'points': [
                    [parseFloat(metricParts[2]) * 1000, parseFloat(metricParts[1]).toFixed(2)]
                ]
            }];

        if (destinations) {
            utils.filterValidHosts(destinations.hosts, function (validDestinations) {
                if (validDestinations) {
                    if (validDestinations.length != destinations.hosts.length) {
                        l.warn('There are invalid destinations for: ' + prefix + '. Expected ' + destinations.length + ' but found ' + validDestinations.length);
                    } else {
                        strategies.handleIO(destinations.writeStrategy,
                            validDestinations,
                            influx.flushMetrics,
                            [metric, l]
                        );
                    }
                } else {
                    l.warn('No valid destinations found for: ' + prefix);
                }
            });
        } else {
            l.warn('Received metric for unknown destination: ' + metricParts[0]);
        }
    };

    return function _processMetricLines(lines) {

        lines = lines.toString();

        if (!config.destinations) {
            l.error('Destinations are unavailable.');
            return;
        }

        if (lines && typeof lines === 'string') {
            lines.split('\n').forEach(function (metric) {
                if (metric) {
                    processMetricLine(metric);
                }
            });
        }
    };
}

module.exports = {

    createServer: function(config) {
        if (config.carbon.tcp) {
            tcp.start(config.carbon.tcp.port, config.carbon.tcp.address, processMetricLine(config));
        }

        if (config.carbon.udp) {
            udp.start(config.carbon.udp.port, config.carbon.udp.address, config.carbon.udp.ipv6, processMetricLine(config));
        }

    }
};