'use strict';

var dgram = require('dgram');

var RelayClient = function (host, port) {
    this.host = host;
    this.port = port;
    this.udpClient = dgram.createSocket('udp4');
};

RelayClient.prototype.send = function(message) {
    var buffer = new Buffer(message);
    this.udpClient.send(buffer, 0, buffer.length, this.port, this.host, function(err) {
        if (err) throw err;
    });
};

RelayClient.prototype.close = function() {
    this.udpClient.close();
};

module.exports = RelayClient;