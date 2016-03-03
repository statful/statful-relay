'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = require('chai').expect;

var RelayClient = require('../setup/relay-client');

var targetHost = process.env.targetHost;
var telemetronPort = process.env.telemetronPort;
var clientsCount = process.env.clientsCount;
var metricsPerRequest = process.env.metricsPerRequest;
var cycleDurationMs = process.env.cycleDurationMs;


describe('Telemetron metrics are sent from clients', function () {
    this.timeout(process.env.timeout);

    var metric1 = 'testacc.system.derive.disk,cluster=integration,host=localhost,device=xvda,type=disk_octets,operation=read 1.0 1445108447';
    var metric2 = 'testacc.application.counter.application_start,app=tel,env=dev,cluster=local,host=localhost 1 1454962639 sum,count,count_ps,10';
    var metric3 = 'testacc.application.buffer.flush_length,app=tel,env=dev,cluster=local,host=localhost 1 1454962640 avg,10';

    var subject;

    before(function () {
        subject = new RelayClient(targetHost, telemetronPort);
    });

    after(function () {
        subject.close();
    });

    it('should send a collection of metrics to Telemetron', function (done) {
        setTimeout(done, process.env.durationMs);

        var metrics = '';

        for (var i = 0; i < metricsPerRequest; i++) {
            if ((i + 1) % 3) metrics += metric3;
            else if ((i + 1) % 2) metrics += metric2;
            else if ((i + 1) % 1) metrics += metric1
        }

        for (i = 0; i < clientsCount; i++) {
            setInterval(function() {
                subject.send(metric1 + '\n' + metric2 + '\n' + metric3);
            }, cycleDurationMs);
        }
    });
});