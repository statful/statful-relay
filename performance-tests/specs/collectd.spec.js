'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = require('chai').expect;

var RelayClient = require('../setup/relay-client');
var collectd = require('collectd-protocol');

var targetHost = process.env.targetHost;
var collectdPort = process.env.collectdPort;
var clientsCount = process.env.clientsCount;
var metricsPerRequest = process.env.metricsPerRequest;
var cycleDurationMs = process.env.cycleDurationMs;

describe('Collectd metrics are sent from collectd agents', function () {
    this.timeout(process.env.timeout);

    var simpleMetric = {
        host: 'localhost',
        time: 1455098772,
        interval: 10,
        plugin: 'GenericJMX',
        plugin_instance: 'MemoryPool|Eden_Space',
        type: 'memory',
        type_instance: 'committed',
        dstypes: [ 'gauge' ],
        values: [ 152567808.92 ],
        dsnames: [ 'value' ]
    };

    var subject;

    before(function () {
        subject = new RelayClient(targetHost, collectdPort);
    });

    after(function () {
        subject.close();
    });

    it('should send metrics from multiple requests to Telemetron', function (done) {
        setTimeout(done, process.env.durationMs);

        var metrics = [];

        for (var i = 0; i < metricsPerRequest; i++) {
            metrics.push(simpleMetric)
        }

        var metric = collectd.encoder.encode(metrics);

        for (i = 0; i < clientsCount; i++) {
            setInterval(function() {
                subject.send(metric);
            }, cycleDurationMs);
        }
    });
});