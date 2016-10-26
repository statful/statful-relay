var path = require('path');
var schema = require('./schema');
var validate = require('jsonschema').validate;
var Promise = require('bluebird');

var Config = function (file) {
    this.file = file;
    this.config = null;
};

function processConfig(self) {
    return new Promise( function(resolve, reject) {
        var config;

        if (self.file) {
            try {
                config = require(path.resolve(self.file));
            } catch (ex) {
                reject('Failed to load config file ' + self.file + ' with: ' + ex);
            }
        } else {
            reject('Failed to load config because there\'s no file passed to configurator.');
        }

        try {
            validate(config, schema, {throwError: true});
        } catch (ex) {
            reject('Failed to validate config with: ' + ex);
        }

        self.config = config;
        resolve(config);
    });
}

Config.prototype.load = function () {
    var self = this;

    return new Promise( function(resolve, reject) {
        processConfig(self).then(
            function (config) {
                resolve(config);
            },
            function (error) {
                reject(error);
            }
        );
    });
};

module.exports = Config;

