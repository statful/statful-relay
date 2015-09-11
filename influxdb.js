/*jshint node:true, laxcomma:true */

var config = require('./lib/config'),
    carbon = require('./lib/carbon'),
    collectd = require('./lib/collectd'),
    influxdb = require('./lib/influxdb'),
    Telemetron = require('telemetry-client-nodejs'),
    tel = require('./lib/tel');


/**
 *
 */
config.configFile(process.argv[2], function (config) {

    var telemetron = new Telemetron(config.telemetronMetrics);

    // start the process to refresh accounts from TEL
    tel.setupAccounts(config, telemetron).on('accountsChanged', function () {
        config.destinations = influxdb.indexDestinations(config);
    });

    // create servers for Carbon Listening
    carbon.createServer(config, telemetron);


    // create restify HTTP server for CollectD
    collectd.createServer(config, telemetron);


});
