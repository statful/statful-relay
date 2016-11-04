var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = require('chai').expect;
var mockTool = require('../setup/mock-tool');

var testRelay;
/*jshint -W117 */
before(function (done) {
    testRelay = require('../setup/bootstrap-relay');

    // Wait for Relay to start
    // TODO - change this read an healthcheck
    setTimeout(function() {
        done();
    }, 1);
});

after(function () {
    testRelay.kill();
    mockTool.reset();
});

afterEach(function() {
    return expect(mockTool.reset()).to.eventually.be.fulfilled;
});