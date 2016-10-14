'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
//var expect = require('chai').expect;

var RelayClient = require('../setup/relay-client');

var targetHost = process.env.targetHost;
var statfulPort = process.env.statfulPort;
var clientsCount = process.env.clientsCount;
var metricsPerRequest = process.env.metricsPerRequest;
var cycleDurationMs = process.env.cycleDurationMs;


describe('Statful metrics are sent from clients', function () {
    this.timeout(process.env.timeout);

    var metric1 = 'testacc.system.derive.disk,cluster=integration,host=localhost,device=xvda,type=disk_octets,operation=read VALUE TIME';
    var metric2 = 'testacc.application.counter.application_start,app=tel,env=dev,cluster=local,host=localhost VALUE TIME sum,10';
    var metric3 = 'testacc.application.buffer.flush_length,app=tel,env=dev,cluster=local,host=localhost VALUE TIME avg,10';

    var subject;

    before(function () {
        subject = new RelayClient(targetHost, statfulPort);
    });

    after(function () {
        subject.close();
    });

    it('should send a collection of metrics to Telemetron', function (done) {
        setTimeout(done, process.env.durationMs);

        var metrics = '';

        for (var i = 0; i < metricsPerRequest; i++) {
            if ((i + 1) % 3) {
                metrics += metric3;
            } else if ((i + 1) % 2) {
                metrics += metric2;
            } else if ((i + 1) % 1) {
                metrics += metric1;
            }
        }

        /*jshint loopfunc: true */
        for (i = 0; i < clientsCount; i++) {
            setInterval(function() {
                var metricLine1 = metric1.replace('TIME', new Date().getTime()).replace('VALUE', Math.random());
                var metricLine2 = metric2.replace('TIME', new Date().getTime()).replace('VALUE', Math.random());
                var metricLine3 = metric3.replace('TIME', new Date().getTime()).replace('VALUE', Math.random());
                subject.send(metricLine1 + '\n' + metricLine2 + '\n' + metricLine3);
            }, cycleDurationMs);
        }
    });
});
