var logger = require('./logger'),
    http = require('http'),
    events = require('events'),
    util = require('util');


var Accounts = function (config) {
    var self = this,
        l = new logger.Logger(config.log || {});

    this.updateAccounts = function () {
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
                    var prevAccounts = config.accounts,
                        currAccounts = JSON.parse(responseText);

                    if (JSON.stringify(prevAccounts) != JSON.stringify(currAccounts)) {
                        l.log('Accounts configuration updated from TEL', "INFO");
                        config.accounts = currAccounts;

                        self.emit('accountsChanged', config.accounts);
                    }
                }
            });

        });

        accountsReq.on('error', function (e) {
            l.log('Error connecting to TEL: ' + e.message, "ERROR");
        });

        accountsReq.end();
    };

    this.updateAccounts();

    setInterval(this.updateAccounts, config.tel.refreshInterval);
};

util.inherits(Accounts, process.EventEmitter);

exports.Accounts = Accounts;

exports.setupAccounts = function (config) {
    return new Accounts(config);
};