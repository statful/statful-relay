'use strict';

var childProcess = require('child_process');
var testRelay = childProcess.spawn('node', ['bin/relay.js', 'integration-tests/conf/config.json']);

var stderr = '';

testRelay.on('exit', function (code) {
    console.log('Child process exited with exit code ' + code);
});

testRelay.stderr.on('data', function(data) {
    stderr += data.toString();
});

testRelay.on('close', function() {
    console.log(stderr);
});

exports.kill = function () {
    testRelay.kill('SIGINT');
};