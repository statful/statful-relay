var dgram = require('dgram');
var Utils = require('../utils');
var Logger = require('../logger');

var UDP = function (udpConfig, serverCallback) {
    this.udpConfig = udpConfig;
    this.serverCallback = serverCallback;
    this.server = null;
    this.logger = Logger.sharedLogger().child({ file: Utils.getCurrentFile(module) }, true);
};

/**
 * Starts the UDP transport
 */
UDP.prototype.start = function () {
    var port = this.udpConfig.port;
    var address = this.udpConfig.address;
    var ipv6 = this.udpConfig.ipv6;
    var udp_version = ipv6 ? 'udp6' : 'udp4';

    this.server = dgram.createSocket(udp_version, this.serverCallback);
    this.server.bind(port || 2014, address || undefined);

    var self = this;
    self.server.on('listening', function () {
        var address = self.server.address();
        self.logger.info(
            'UDP transport service has been started on address: ' + address.address + ' and port: ' + address.port
        );
    });

    self.server.on('error', function (error) {
        self.logger.error('error on udp transport:' + error.stack);
        self.server.close();
    });

    return true;
};

/**
 * Stops the UDP transport
 */
UDP.prototype.stop = function () {
    if (this.server) {
        this.server.close();
        this.logger.info('UDP transport service has been stopped');
    }
};

module.exports = UDP;
