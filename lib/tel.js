var logger = require('./logger'),
    http = require('http'),
    util = require('util');


var Accounts = function (config, telemetron) {
    var self = this,
        l = logger.init(config, module);

    this.updateAccounts = function () {
        l.info('Refreshing accounts configuration from TEL');

        var options = {
            hostname: config.tel.host,
            port: config.tel.port,
            path: config.tel.url.accounts
        }, start = new Date().getTime();


        var accountsReq = http.request(options, function (res) {

            var responseText = '';

            res.on('data', function (body) {
                responseText += body;
            });

            res.on('end', function () {
                if (res.statusCode === 200) {
                    var prevAccounts = config.accounts,
                        currAccounts = JSON.parse(responseText);

                    if (JSON.stringify(prevAccounts) !== JSON.stringify(currAccounts)) {
                        l.info('Accounts configuration updated from TEL');
                        config.accounts = currAccounts;

                        self.emit('accountsChanged', config.accounts);
                        telemetron.inc('accounts_changed', 1);
                    }
                }

                telemetron.time('service', new Date().getTime() - start, {from: telemetron.app, to: 'tel', statusCode: res.statusCode, status: 'success'});
            });

        });

        accountsReq.on('error', function (e) {
            l.error('Error connecting to TEL: ' + e.message);
            telemetron.time('service', new Date().getTime() - start, {from: telemetron.app, to: 'tel', status: 'failure'});
        });

        accountsReq.end();
    };

    this.updateAccounts();

    setInterval(this.updateAccounts, config.tel.refreshInterval);
};

util.inherits(Accounts, process.EventEmitter);

exports.Accounts = Accounts;

exports.setupAccounts = function (config, telemetron) {
    return new Accounts(config, telemetron);
};