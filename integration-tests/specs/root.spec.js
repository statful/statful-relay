var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = require('chai').expect;

var sleep = require('sleep');
var mockTool = require('../setup/mock-tool');

var testRelay;
/*jshint -W117 */
before(function () {
    testRelay = require('../setup/bootstrap-relay');

    // Wait for Relay to start
    // TODO - change this read an healthcheck
    sleep.sleep(1);
});

after(function () {
    testRelay.kill();
});

afterEach(function() {
    return expect(mockTool.reset()).to.eventually.be.fulfilled;
});