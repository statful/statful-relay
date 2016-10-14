/*jshint node:true, laxcomma:true */

var configUtil = require('./../lib/config');
var Relay = require('../lib/statful-relay');
var Statful = require('statful-client');

/**
 * Starts the Statful relay.
 *
 * @param udpConfig The UDP configuration to use
 * @param systemStats
 * @param statful A Statful client instance
 */
function startStatfulRelay(udpConfig, systemStats, statful) {
    var statfulRelay = new Relay(udpConfig, systemStats, statful);
    statfulRelay.start();
}

/**
 * Parses the configuration file and starts the Relay.
 */
configUtil.configFile(process.argv[2], function (config) {

    var statfulLoadedConfing = configUtil.buildRelayConfig(config);
    var statful = new Statful(statfulLoadedConfing);

    statful.counter('application_start', 1);

    startStatfulRelay(config.statfulServer, config.systemStats, statful);
});
