'use strict';

var conf = require('../conf/mockserver.json');
var mockServerClient = require('mockserver-client').mockServerClient(conf.host, conf.port);
var Q = require('q');

var VERIFY_TIMEOUT = 1000;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function mockSimple(path, httpStatus) {
    mockServerClient.mockSimpleResponse(path, httpStatus);
}

function mock(expectation) {
    mockServerClient.mockAnyResponse(expectation);
}

function verify(request, count) {
    if (count === undefined) {
        count = 1;
    }

    var deferred = Q.defer();

    var verifyCallback = function () {
        return mockServerClient.verify(request, count, true)
    };

    var mockServerCheckerTimeout = setTimeout(function () {
        cancel();
        if (count == 0) {
            deferred.resolve(verifyCallback());
        } else {
            deferred.reject('Timeout waiting for mock server');
        }
    }, VERIFY_TIMEOUT);

    var mockServerChecker = setInterval(function () {
        var requests = mockServerClient.retrieveRequests(request.path);
        requests.then(function (requests) {
            if (requests.length >= count) {
                cancel();
                deferred.resolve(verifyCallback());
            }
        });
    }, 50);

    function cancel() {
        clearTimeout(mockServerCheckerTimeout);
        clearInterval(mockServerChecker);
    }
    return deferred.promise;
}

function reset() {
    return mockServerClient.reset();
}

function clear(path) {
    return mockServerClient.clear(path);
}

exports.mockSimple = mockSimple;
exports.mock = mock;
exports.verify = verify;
exports.clear = clear;
exports.reset = reset;