'use strict';

var expect = require('chai').expect;

var RelayClient = require('../setup/relay-client');
var mockTool = require('../setup/mock-tool');

describe('Telemetron metrics are sent from clients', function () {

    var metric1 = 'testacc.system.derive.disk,cluster=integration,host=localhost,device=xvda,type=disk_octets,operation=read 1.0 1445108447';
    var metric2 = 'testacc.application.counter.application_start,app=tel,env=dev,cluster=local,host=localhost 1 1454962639 sum,count,count_ps,10';
    var metric3 = 'testacc.application.buffer.flush_length,app=tel,env=dev,cluster=local,host=localhost 1 1454962640 avg,10';

    var subject;

    before(function () {
        subject = new RelayClient('127.0.0.1', 3013);
    });

    after(function () {
        subject.close();
    });

    it('should send a simple metric to Telemetron', function () {
        mockTool.mockSimple('/tel/v2.0/metrics', 201);

        subject.send(metric1);

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/metrics',
            'body': metric1
        });

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should send a collection of metrics to Telemetron', function () {
        mockTool.mockSimple('/tel/v2.0/metrics', 201);

        subject.send(metric1 + '\n' + metric2 + '\n' + metric3);

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/metrics',
            'body': metric1 + '\n' + metric2 + '\n' + metric3
        });

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should send metrics from multiple requests to Telemetron', function () {
        mockTool.mockSimple('/tel/v2.0/metrics', 201);

        subject.send(metric1);
        subject.send(metric2);
        subject.send(metric3);

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/metrics',
            'body': metric1 + '\n' + metric2 + '\n' + metric3
        });

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should handle with underlying service errors', function () {
        mockTool.mockSimple('/tel/v2.0/metrics', 500);

        subject.send(metric1);

        // Wait for the first flush
        setTimeout(function () {
            subject.send(metric1);
        }, 10);

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/metrics',
            'body': metric1
        }, 2);

        return expect(verified).to.eventually.be.fulfilled;
    });

    it('should handle invalid metrics', function () {
        mockTool.mockSimple('/tel/v2.0/metrics', 500);

        subject.send('|\\sw>!@,[]/%*.');

        var verified = mockTool.verify({
            'method': 'PUT',
            'path': '/tel/v2.0/metrics',
            'body': {
                'type': 'REGEX',
                'value': '|\\sw>!@,[]/%*.'
            }
        });

        return expect(verified).to.eventually.be.fulfilled;
    });
});