/*jshint node:true, laxcomma:true */

var configUtil = require('./../lib/config');
var telemetronConfig = require('../conf/telemetron.json');
var Relay = require('../lib/telemetron-relay');
var Telemetron = require('statful-client');

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
 * Parses the configuration file and starts the Relay.
 */
configUtil.configFile(process.argv[2], function (config) {

    var telemetronConf = configUtil.buildRelayConfig(config, telemetronConfig);
    var telemetron = new Telemetron(telemetronConf);
    telemetron.counter('application_start', 1);
    startTelemetronRelay(config.telemetronServer, config.autoDiagnostics, telemetron);
});
