/*jshint node:true, laxcomma:true */

var config = require('./../lib/config'),
    Relay = require('../telemetry-relay'),
    Telemetron = require('telemetry-client-nodejs');


/**
 *
 */
config.configFile(process.argv[2], function (config) {

    var telemetron = new Telemetron(config.telemetron);

    telemetron.inc('application_start', 1);

    var relay = new Relay(config, telemetron);

    relay.start();

});
