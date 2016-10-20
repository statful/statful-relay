var yargs = require('yargs');
var Commands = require('./commands');

var Interface = function() {
    yargs
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
            Commands.start(path).then(
                function(returnedPath) {
                    return console.log('Statful Relay successfully loaded with configuration file at \'' + returnedPath + '\'');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === 'start-managed') {
            Commands.startManaged(path).then(
                function() {
                    return console.log('Pm2 successfully request a spawn for Statful Relay process.');
                },
                function(error) {
                    return console.error(error);
                }
            );
        } else if (argv._[0] === 'generate-config') {
            Commands.generateConfig(path).then(
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

module.exports = Interface;