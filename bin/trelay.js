/*jshint node:true, laxcomma:true */

var config = require('./../lib/config'),
    Relay = require('../telemetry-relay'),
    CollectdRelay = require('../collectd-relay'),
    Telemetron = require('telemetry-client-nodejs');

/**
 * Major hack to be able to send json structures using Telemetron client.
 *
 * @param telemetronClient The Telemetron client to override
 */
function overrideTelemetronClient(telemetronClient) {
    var metrics;
    telemetronClient.putRaw = function (metric) {

        if (typeof metric !== 'undefined') {
            if (this.bufferSize == 0) {
                metrics = [];
            }
            metrics.push(metric);
            this.bufferSize = metrics.length;
            this.buffer = JSON.stringify(metrics);
        } else {
            console.error('Invalid metric: ' + metric);
        }
    };
}

/**
 * Starts the Telemetron relay.
 *
 * @param relayConfig The relay configuration to use
 * @param telemetron A Telemetron client instance
 */
function startTelemetronRelay(relayConfig, telemetron) {
    var telemetronRelay = new Relay(relayConfig, telemetron);
    telemetronRelay.start();
}

/**
 * Starts the Telemetron relay for Collectd.
 *
 * @param collectdConfig The relay configuration to use
 * @param telemetron A Telemetron client instance for measuring the relay only
 */
function startCollectdRelay(collectdConfig, telemetron) {
    var collectdApiSender = new Telemetron(collectdConfig);
    overrideTelemetronClient(collectdApiSender);

    var collectdRelay = new CollectdRelay(collectdConfig, telemetron, collectdApiSender);
    collectdRelay.start();
}

/**
 * Parses the configuration file and starts the Relay.
 */
config.configFile(process.argv[2], function (config) {
    var telemetron = new Telemetron(config.telemetron);
    telemetron.inc('application_start', 1);

    startTelemetronRelay(config.telemetron, telemetron);
    startCollectdRelay(config.collectd, telemetron);
});
