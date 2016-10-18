var dgram = require('dgram');
var server = null;

exports.start = function (udpConfig, callback) {
    var port = udpConfig.port;
    var address = udpConfig.address;
    var ipv6 = udpConfig.ipv6;
    var udp_version = ipv6 ? 'udp6' : 'udp4';

    server = dgram.createSocket(udp_version, callback);
    server.bind(port || 2014, address || undefined);

    return true;
};

exports.stop = function () {
    if (server) {
        server.close();
    }
};
