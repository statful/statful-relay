var Config = require('../lib/config/config.js');
var Statful = require('statful-client');
var Relay = require('../lib/relay');
var fs = require('fs-extra');
var path = require('path');
var pm2 = require('pm2');

var generateConfig = function(configPath) {
    var normalizedPath = path.normalize(configPath);
    var source = path.normalize(__dirname + '/conf/defaults.json');
    var target = path.join(normalizedPath, 'statful-relay-conf.json');

    return new Promise(function(resolve, reject) {
        fs.copy(source, target, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(normalizedPath);
            }
        });
    });
};

var start = function(configPath) {
    var configToTry = new Config(configPath);

    return new Promise(function(resolve, reject) {
        configToTry.load().then(
            function(loadedConfig) {
                var statfulClient = new Statful(loadedConfig.statfulClient);
                var statfulRelay = new Relay(loadedConfig, statfulClient);

                if (statfulClient && statfulRelay) {
                    statfulRelay.start();

                    if (loadedConfig.statfulClient.systemStats) {
                        statfulClient.counter('application_start', 1);
                    }

                    resolve(path.normalize(configPath));
                } else {
                    reject('Error starting Statful Relay with given configuration.');
                }

            },
            function(error) {
                reject(error);
            }
        );
    });
};

var startManaged = function(configPath) {
    return new Promise(function(resolve, reject) {
        pm2.connect(function(err) {
            if (err) {
                reject(err);
            } else {
                pm2.start({
                    name: 'statful-relay',
                    script: 'statful-relay',
                    args: 'start ' + configPath
                }, function(err) {
                    pm2.disconnect();

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });


    });
};

var stopManaged = function() {
    return new Promise(function(resolve, reject) {
        pm2.connect(function(err) {
            if (err) {
                reject(err);
            } else {
                pm2.stop('statful-relay',
                    function(err) {
                    pm2.disconnect();

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
};

var restartManaged = function() {
    return new Promise(function(resolve, reject) {
        pm2.connect(function(err) {
            if (err) {
                reject(err);
            } else {
                pm2.restart('statful-relay',
                    function(err) {
                        pm2.disconnect();

                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
            }
        });
    });
};

module.exports = {
    generateConfig: generateConfig,
    start: start,
    startManaged: startManaged,
    stopManaged: stopManaged,
    restartManaged: restartManaged
};