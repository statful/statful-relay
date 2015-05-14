var logger = require('./logger'),
    http = require('http');

module.exports = {

    refreshAccounts: function (config) {

        var l = new logger.Logger(config.log || {}),
            interval = null;

        var refreshAccountsCycle = function() {

            l.log('Refreshing accounts configuration from TEL', "INFO");

            var options = {
                hostname: config.tel.host,
                port: config.tel.port,
                path: config.tel.url.accounts
            };


            var accountsReq = http.request(options, function (res) {

                var responseText = "";

                res.on('data', function (body) {
                    responseText += body;
                });

                res.on('end', function () {
                    if (res.statusCode == 200) {
                        config.accounts = JSON.parse(responseText);
                        l.log('Accounts configuration reloaded from TEL', "INFO");
                    }
                });

            });

            accountsReq.on('error', function (e) {
                l.log('Error connecting to TEL: ' + e.message, "ERROR");
            });

            accountsReq.end();
        };

        // call the refresh immediately and set it on an interval
        refreshAccountsCycle();
        interval = setInterval(refreshAccountsCycle, config.tel.refreshInterval);

    }
};
