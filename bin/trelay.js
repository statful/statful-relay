/*jshint node:true, laxcomma:true */

var config = require('./../lib/config'),
    Relay = require('../telemetry-relay'),
    CollectdRelay = require('../collectd-relay'),
    Telemetron = require('telemetry-client-nodejs');


/**
 *
 */
config.configFile(process.argv[2], function (config) {
    // Start Telemetron metrics relay
    var telemetron = new Telemetron(config.telemetron);
    telemetron.inc('application_start', 1);

    //var telemetronRelay = new Relay(config.telemetron, telemetron);
    //telemetronRelay.start();

    // Start Collectd metrics relay
    var collectd = new Telemetron(config.collectd);
    var collectdRelay = new CollectdRelay(config.collectd, collectd);
    collectdRelay.start();
});
