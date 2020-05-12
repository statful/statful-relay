var StatfulListener = require('./listeners/statful');
var Logger = require('./logger');
var Utils = require('./utils');
var http = require('http');
var profiler = require('v8-profiler-node8');
var zlib = require('zlib');

/**
 * Constructor for the Statful Relay
 *
 * @param config A configuration object of the relay.
 * @param statful An instance of Statful client to send metrics.
 * @constructor
 */
var Relay = function (config, statful) {
    this.config = config;
    this.statful = statful;
    this.logger = Logger.sharedLogger(this.config).child({ file: Utils.getCurrentFile(module) }, true);
};

/**
 * Starts the Statful Relay
 */
Relay.prototype.start = function () {
    this.statfulListener = new StatfulListener(this.config.listeners.statful, this.statful);
    this.logger.info('Statful relay will start. All configured listeners will be created.');
    this.statfulListener.start();

    if (this.config.debug) {
        http.createServer((req, res) => {
            switch (req.url) {
                case '/heapdump':
                    downloadHeapdump().then(data => {
                        res.write(data);
                        res.end();
                    });
                    break;
                case '/memory':
                    var used = process.memoryUsage().heapUsed / 1024 / 1024;
                    res.write(used + 'MB');
                    res.end();
                    break;
            }
        }).listen(9000);
    }
};

function downloadHeapdump () {
    return new Promise(resolve => {
        var snapshot1 = profiler.takeSnapshot();
        snapshot1.export((error, result) => {
            zlib.gzip(result, (err, buffer) => {
                resolve(buffer);
            });
        });
    });
}

/**
 * Stops the Statful Relay
 */
Relay.prototype.stop = function () {
    this.statfulListener.stop();
    this.logger.info('Statful relay has been stopped.');
};

module.exports = Relay;
