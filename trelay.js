/*jshint node:true, laxcomma:true */

var config = require('./lib/config'),
    relay = require('./lib/relay'),
    Telemetron = require('telemetry-client-nodejs');


/**
 *
 */
config.configFile(process.argv[2], function (config) {

    var telemetron = new Telemetron(config.telemetronMetrics);

    telemetron.inc('application_start', 1);

    relay.createServer(config, telemetron);

});
