'use strict';

var expect = require('chai').expect;

var RelayClient = require('../setup/relay-client');
var mockTool = require('../setup/mock-tool');
var collectd = require('collectd-protocol');

describe('Collectd metrics are sent from collectd agents', function () {

    var customPartsConf = {
        0x0099: 'tags'
    };

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
        dsnames: [ 'value' ],
        tags: 'environment=qa,cluster=prodA,cluster=prodB'
    };

    var resultMetric = {
        host: 'localhost',
        time: 1455098772,
        interval: 10,
        plugin: 'GenericJMX',
        plugin_instance: 'MemoryPool|Eden_Space',
        type: 'memory',
        type_instance: 'committed',
        dstypes: [ 'gauge' ],
        values: [ 152567808.92 ],
        dsnames: [ 'value' ],
        tags: [
            { name: 'environment', values: ['qa'] },
            { name: 'cluster', values: ['prodA', 'prodB'] }
        ]
    };

    var subject;

    before(function () {
        subject = new RelayClient('127.0.0.1', 3023);
    });

    after(function () {
        subject.close();
    });

    it('should send a simple metric to Telemetron', function () {
        mockTool.mockSimple('/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost', 201);

        var metrics = [simpleMetric];
        var metric = collectd.encoder.encodeCustom(metrics, customPartsConf);

        subject.send(metric);

        var verified = mockTool.verify({
                'method': 'PUT',
                'path': '/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost',
                'body': JSON.stringify([resultMetric])
            });

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should send a collection of metrics to Telemetron', function () {
        mockTool.mockSimple('/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost', 201);

        var metrics = [simpleMetric, simpleMetric, simpleMetric, simpleMetric];
        var metric = collectd.encoder.encodeCustom(metrics, customPartsConf);

        subject.send(metric);

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost',
            'body': JSON.stringify([resultMetric, resultMetric, resultMetric, resultMetric])
        });

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should send metrics from multiple requests to Telemetron', function () {
        mockTool.mockSimple('/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost', 201);

        var metrics = [simpleMetric];
        var metric = collectd.encoder.encodeCustom(metrics, customPartsConf);

        subject.send(metric);
        subject.send(metric);
        subject.send(metric);

        var metricsToVerify = [resultMetric, resultMetric, resultMetric];

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost',
            'body': JSON.stringify(metricsToVerify)
        });

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should handle with underlying service errors', function () {
        mockTool.mockSimple('/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost', 500);

        var metrics = [simpleMetric];
        var metric = collectd.encoder.encodeCustom(metrics, customPartsConf);

        subject.send(metric);

        // Wait for the first flush
        setTimeout(function () {
            subject.send(metric);
        }, 10);

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost',
            'body': JSON.stringify([resultMetric])
        }, 2);

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should handle invalid metrics', function () {
        mockTool.mockSimple('/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost', 500);

        subject.send('|\\sw>!@,[]/%*.');

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/collectd/collectd/env=dev,cluster=local,host=localhost'
        }, 0);

        return expect(verified).to.eventually.be.fulfilled;
    });
});