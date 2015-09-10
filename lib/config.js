/*jshint node:true, laxcomma:true, evil:true */

var fs = require('fs'),
    util = require('util');

var Configurator = function (file) {

    var self = this;

    this.updateConfig = function () {
        util.log('reading config file: ' + file);

        fs.readFile(file, function (err) {
            if (err) {
                throw err;
            }

            self.config = eval('config = ' + fs.readFileSync(file));
            self.emit('configChanged', self.config);
        });
    };

    this.updateConfig();

    fs.watch(file, function (event) {
        if (event === 'change' && self.config.automaticConfigReload !== false) {
            self.updateConfig();
        }
    });
};

util.inherits(Configurator, process.EventEmitter);

exports.Configurator = Configurator;

exports.configFile = function (file, callbackFunc) {
    var config = new Configurator(file);
    config.on('configChanged', function () {
        callbackFunc(config.config);
    });
};

