/*jshint node:true, laxcomma:true */

var config = require('./lib/config'),
    tcp = require('./lib/tcp'),
    api = require('./lib/api'),
    tel = require('./lib/tel');


/**
 *
 */
config.configFile(process.argv[2], function (config) {

    // start the process to refresh accounts from TEL
    tel.setupAccounts(config).on('accountsChanged', function(accounts) {
        config.destinations = api.indexDestinations(config)
    });

    // create TCP server
    tcp.start(config, api.processMetricLine(config));
});
