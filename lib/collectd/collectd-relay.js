var udp = require('./../udp');
var protocol = require("./collectd-protocol");

/**
 * Builds up a function to dispatch incoming metrics
 *
 * @returns {Function}
 */
function dispatchMetricLine(telemetron) {
    return function (lines) {

        var parsed = protocol.collectd_parse(lines);
        var numberOfMetrics = parsed.length;

        var metrics = JSON.stringify(parsed);

        if (metrics && typeof metrics === 'string') {
            telemetron.putRaw(metrics);
            telemetron.inc('metrics_flushed', numberOfMetrics);
        }
    };
}

var Relay = function (config, telemetron) {
    this.config = config;
    this.telemetron = telemetron;
};

Relay.prototype.start = function () {
    udp.start(this.config.udpListen.port, this.config.udpListen.address, this.config.udpListen.ipv6,
        dispatchMetricLine(this.telemetron));
};

Relay.prototype.stop = function () {
    udp.stop();
};

module.exports = Relay;