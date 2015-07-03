'use strict';

var async = require('async');

/**
 * Implements the fanout write strategy which means multiplexing write to all hosts
 *
 * @param hostsList
 * @param execFunc
 * @param execArgs
 */
function fanoutWrite(hostsList, execFunc, execArgs) {
    hostsList.forEach(function (host) {
        var args = [];
        args.push(host);

        execArgs.forEach(function (arg) {
            args.push(arg);
        });

        execFunc.apply(null, args);
    });
}

module.exports = {
    /**
     * Handle execution of write operation with supported strategies.
     * Expects the execFunc interface to be (host, execArgs[0], execArgs[1], ...)
     *
     * @param strategy
     * @param hostsList
     * @param execFunc
     * @param execArgs
     */
    handleWriteStrategies: function(strategy, hostsList, execFunc, execArgs) {
        switch (strategy) {
            case 'fanout':
                fanoutWrite(hostsList, execFunc, execArgs);
                break;
            default:
                fanoutWrite(hostsList, execFunc, execArgs);
        }
    }
};

