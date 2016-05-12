/*jshint node:true, laxcomma:true, evil:true */

var fs = require('fs'),
    util = require('util'),
    merge = require('lodash/merge');

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

/**
 * Converts a json object to a string list of properties.
 *
 * @param json The json object to convert
 * @returns {string} A list of comma separated properties
 */
function jsonToCommaList(json) {
    var res = [];

    if (typeof json !== 'undefined') {
        Object.keys(json).forEach(function (key) {
            res.push(key + '=' + json[key]);
        });
    }

    return res.join(',');
}

/**
 * Replaces a placeholder with the specified string.
 *
 * @param source The source string which may contain a placeholder
 * @param string The string to replace the placeholder
 * @returns {string} The source string without placeholders and resolved with string
 */
function replacePlaceHolder(source, string) {
    return source.replace(/{\w+}/g, string);
}

/**
 * Builds a relay configuration.
 *
 * @param config The general application configuration
 * @param telemetronConfig The telemetron configuration
 * @returns {object} The built relay configuration
 */
exports.buildRelayConfig = function(config, telemetronConfig) {
    var merged = merge({
        'prefix': config.api.prefix,
        'tags': config.tags,
        'api': {
            'protocol': config.api.protocol,
            'host': config.api.host,
            'port': config.api.port,
            'token': config.api.token,
            'timeout': config.api.timeout
        },
        'flushInterval': config.api.metricsFlushInterval,
        'flushSize': config.api.metricsFlushSize,
        'compression': config.api.compression,
        'autoDiagnostics': config.autoDiagnostics
    }, telemetronConfig);

    var tagsList = jsonToCommaList(config.tags);
    merged.api.path = replacePlaceHolder(telemetronConfig.api.path, tagsList);

    return merged;
};

