'use strict';

var dgram = require('dgram');

var RelayClient = function (host, port) {
    this.host = host;
    this.port = port;
    this.udpClient = dgram.createSocket('udp4');
};

RelayClient.prototype.send = function(message) {
    this.udpClient.send(message, 0, message.length, this.port, this.host, function(err) {
        if (err) throw err;
    });
};

RelayClient.prototype.close = function() {
    this.udpClient.close();
};

module.exports = RelayClient;