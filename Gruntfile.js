'use strict';

var mockserverConf = require('./tests/integration/conf/mockserver.json');

module.exports = function (grunt) {

    // Command line options
    var testSuite = grunt.option('testSuite') || 'telemetron';

    var targetHost = grunt.option('targetHost') || 'localhost';
    var telemetronPort = grunt.option('telemetronPort') || 2013;
    var collectdPort = grunt.option('collectdPort') || 2023;

    var durationMs = grunt.option('durationMs') || 60000;
    var clientsCount = grunt.option('clientsCount') || 200;
    var metricsPerRequest = grunt.option('metricsPerRequest') || 70;
    var cycleDurationMs = grunt.option('cycleDurationMs') || 10000;

    // Show elapsed time at the end

    require('time-grunt')(grunt);

    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // Load mock-server task
    grunt.loadNpmTasks('mockserver-grunt');

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        buildNumber: process.env.GO_PIPELINE_COUNTER || process.env.BUILD_NUMBER || 1,

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            gruntfile: {
                src: ['Gruntfile.js']
            },
            js: {
                src: ['*.js', 'lib/**/*.js']
            },
            test: {
                src: ['tests/**/*.js']
            }
        },
        mochacli: {
            options: {
                reporter: 'nyan',
                bail: true
            },
            integration: ['tests/integration/specs/**/*.spec.js'],
            performance: {
                options: {
                    env: {
                        timeout: 1800000,
                        durationMs: durationMs,
                        clientsCount: clientsCount,
                        metricsPerRequest: metricsPerRequest,
                        cycleDurationMs: cycleDurationMs,
                        targetHost: targetHost,
                        collectdPort: collectdPort,
                        telemetronPort: telemetronPort
                    }
        },
                src: ['tests/performance/specs/' + testSuite + '.spec.js']
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            js: {
                files: '<%= jshint.js.src %>',
                tasks: ['jshint:js', 'mochacli']
            },
            test: {
                files: '<%= jshint.test.src %>',
                tasks: ['jshint:test', 'mochacli']
            }
        },
        start_mockserver: {
            options: {
                serverPort: mockserverConf.port,
                verbose: true
            }
        },
        stop_mockserver: {
            options: {
                serverPort: mockserverConf.port,
                verbose: true
            }
        }
    });


    grunt.registerTask('dev', [
        'watch'
    ]);

    grunt.registerTask('integration-test', [
        'start_mockserver',
        'continue:on',
        'mochacli:integration',
        'continue:off',
        'stop_mockserver',
        'continue:fail-on-warning'
    ]);

    grunt.registerTask('performance-test', [
        'mochacli:performance'
    ]);

    grunt.registerTask('test', [
        'jshint',
        'integration-test',
        'performance-test'
    ]);

    grunt.registerTask('default', [
        'test'
    ]);
};