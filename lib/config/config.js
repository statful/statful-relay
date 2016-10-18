var path = require('path');
var schema = require('./schema');
var validate = require('jsonschema').validate;

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

Config.prototype.getStatfulClientConfig = function () {
    var statfulClientConfig = {};
    var loadedConfig = this.config;

    if (loadedConfig) {
        statfulClientConfig = {
            'app': loadedConfig.app,
            'tags': loadedConfig.tags,
            'transport': loadedConfig.transport,
            'api': {
                'token': loadedConfig.api.token,
                'timeout': loadedConfig.api.timeout,
                'host': loadedConfig.api.host,
                'port': loadedConfig.api.port
            },
            'flushInterval': loadedConfig.flushInterval,
            'flushSize': loadedConfig.flushSize,
            'systemStats': loadedConfig.systemStats
        };
    }

    return statfulClientConfig;
};

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

