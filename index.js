var Config = require('./lib/config/config.js');
var Statful = require('statful-client');
var Relay = require('./lib/relay');
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
                    statfulClient.counter('application_start', 1);
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

var cli = function() {
    var yargs = require('yargs')
        .usage('Usage: $0 [command] <path>')
        .command('generate-config <path>', 'Generate a default config for Statful Relay on given path.')
        .command('start <path>', 'Start the Statful Relay with a config on the given path.')
        .command('start-managed <path>', 'Start the Statful Relay, managed by pm2, with a config on the given path.')
        .demand(1)
        .strict()
        .example('$0 generate-config /etc/statful-relay/conf', 'Generates a default Statful Relay ' +
            'config file on /etc/statful-relay/conf/ with name statful-relay-conf.json')
        .example('$0 start /etc/statful-relay/conf/statful-relay-conf.json', 'Starts the Statful Relay with the given config.')
        .example('$0 start-managed /etc/statful-relay/conf/statful-relay-conf.json', 'Starts the Statful Relay, managed by pm2, with the given config.')
        .help('help')
        .alias('h', 'help')
        .epilog('Copyright 2016 Statful.');
    var argv = yargs.argv;
    var path = argv.path;

    if (path) {
        if (argv._[0] === 'start') {
            start(path).then(
                function(returnedPath) {
                    return console.log('Statful Relay successfully loaded with configuration file at \'' + returnedPath + '\'');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === 'start-managed') {
            startManaged(path).then(
                function() {
                    return console.log('Pm2 successfully request a spawn for Statful Relay process.');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === 'generate-config') {
            generateConfig(path).then(
                function(returnedPath) {
                    return console.log('Configuration file \'statful-relay-conf.json\' successfully created at \'' + returnedPath + '\'');
                },
                function(error) {
                    return console.error(error);
                }
            );
        }
    }
};

exports.generateConfig = generateConfig;
exports.start = start;
exports.startManaged = startManaged;
exports.cli = cli;