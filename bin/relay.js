/*jshint node:true, laxcomma:true */

var configUtil = require('./../lib/config');
var collectdConfig = require('../conf/collectd-telemetron.json');
var telemetronConfig = require('../conf/telemetron.json');
var Relay = require('../lib/telemetron-relay');
var CollectdRelay = require('../lib/collectd-relay');
var Telemetron = require('telemetry-client-nodejs');

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

            if (this.bufferSize >= this.flushSize) {
                this.flush();
            }
        } else {
            console.error('Invalid metric: ' + metric);
        }
    };
}

/**
 * Starts the Telemetron relay.
 *
 * @param udpConfig The UDP configuration to use
 * @param autoDiagnostics
 * @param telemetron A Telemetron client instance
 */
function startTelemetronRelay(udpConfig, autoDiagnostics, telemetron) {
    var telemetronRelay = new Relay(udpConfig, autoDiagnostics, telemetron);
    telemetronRelay.start();
}

/**
 * Starts the Telemetron relay for Collectd.
 *
 * @param collectdConfig The relay configuration to use
 * @param udpConfig The UDP configuration
 * @param telemetron A Telemetron client instance for measuring the relay only
 */
function startCollectdRelay(collectdConfig, udpConfig, telemetron) {
    var collectdApiSender = new Telemetron(collectdConfig);
    overrideTelemetronClient(collectdApiSender);

    var collectdRelay = new CollectdRelay(udpConfig, collectdConfig.autoDiagnostics, telemetron, collectdApiSender);
    collectdRelay.start();
}

/**
 * Parses the configuration file and starts the Relay.
 */
configUtil.configFile(process.argv[2], function (config) {

    var telemetronConf = configUtil.buildRelayConfig(config, telemetronConfig);
    var telemetron = new Telemetron(telemetronConf);
    telemetron.inc('application_start', 1);
    startTelemetronRelay(config.telemetronServer, config.autoDiagnostics, telemetron);

    var collectdConf = configUtil.buildRelayConfig(config, collectdConfig);
    startCollectdRelay(collectdConf, config.collectdServer, telemetron);
});
