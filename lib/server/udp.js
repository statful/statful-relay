var dgram = require('dgram');


exports.start = function (port, address, ipv6, callback) {
    var udp_version = ipv6 ? 'udp6' : 'udp4';
    var server = dgram.createSocket(udp_version, callback);
    server.bind(port || 2014, address || undefined);
    return true;
};
