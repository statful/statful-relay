/*jshint node:true, laxcomma:true */

var config = require('./../lib/config'),
    Relay = require('../telemetry-relay'),
    CollectdRelay = require('../collectd-relay'),
    Telemetron = require('telemetry-client-nodejs');

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
    var collectdRelay = new CollectdRelay(collectdConfig.udpRelay, telemetron, collectdApiSender);
    collectdRelay.start();
}

/**
 * Parses the configuration file and starts the Relay.
 */
config.configFile(process.argv[2], function (config) {
    var telemetron = new Telemetron(config.telemetron);
    telemetron.inc('application_start', 1);

    startTelemetronRelay(config.telemetron.udpRelay, telemetron);
    startCollectdRelay(config.collectd, telemetron);
});
