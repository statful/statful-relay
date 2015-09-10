var metricParser = require('../lib/metricParser'),
    assert = require('assert');


describe('Metric parsing speed', function () {


    it('Process 100K metrics below 0.03 ms per metric', function (done) {

        this.timeout(4000);


        var metric = 'telemetron.application.response_time,from=udb,to=ams,unit=ms,method=getUserData,host=ams001,environment=live,cluster=clusterA 157.55 1441644168 avg,sum,10 10',
            runs = 100000,
            now = new Date().getTime(),
            duration;


        for (i = 0; i < runs; i++) {
            metricParser.parse(metric);
        }

        duration = new Date().getTime() - now;

        var timePerRequest = duration / runs;
        assert.ok(timePerRequest < 0.03, "Time per metric parse was " + timePerRequest);

        done();

    });
});

