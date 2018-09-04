'use strict';

module.exports = function(grunt) {
    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // Load mock-server task
    grunt.loadNpmTasks('mockserver-grunt');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        buildNumber:
            process.env.GO_PIPELINE_COUNTER || process.env.BUILD_NUMBER || 1,

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
        }
    });

    grunt.registerTask('dev', ['watch']);
};
