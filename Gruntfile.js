'use strict';
module.exports = function (grunt) {

    // Show elapsed time at the end

    require('time-grunt')(grunt);

    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);


    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        buildNumber: process.env.BUILD_NUMBER || 1,

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
                src: ['test/**/*.js']
            }
        },
        mochacli: {
            options: {
                reporter: 'nyan',
                bail: true
            },
            all: ['test/*.js']
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
        nodemon: {
            dev: {
                script: 'ttagger.js',
                options: {
                    args: ['conf/config.json']
                }
            }
        },
        easy_rpm: {
            options: {
                release: '<%= buildNumber %>',
                buildArch: 'noarch',
                requires: ['nodejs >= 0.10.33'],
                license: 'Mindera All Rights Reserved',
                vendor: 'Mindera',
                group: 'Applications',
                url: 'git@bitbucket.org:mindera/<%= pkg.name %>.git'
            },
            release: {
                files: [
                    {src: 'lib/**/*', dest: '/opt/<%= pkg.name %>'},
                    {src: 'node_modules/**/*', dest: '/opt/<%= pkg.name %>'},
                    {src: 'conf/**/*', dest: '/opt/<%= pkg.name %>'},
                    {src: '*.js', dest: '/opt/<%= pkg.name %>'}
                ]
            }
        },

        nexusDeployer: {
            release: {
                options: {
                    groupId: "mindera",
                    artifactId: "<%= pkg.name %>",
                    version: "<%= pkg.version %>-<%= buildNumber %>",
                    packaging: 'rpm',
                    auth: {
                        username: 'deployment',
                        password: 'deployment123'
                    },
                    pomDir: 'build/pom',
                    url: 'http://nexus.mindera:8081/content/repositories/yum_releases',
                    artifact: '<%= pkg.name %>-<%= pkg.version %>-<%= buildNumber %>.noarch.rpm',
                    noproxy: 'localhost',
                    cwd: ''
                }
            }
        }
    });

    grunt.registerTask('serve', [
        'nodemon'
    ]);

    grunt.registerTask('dev', [
        'watch'
    ]);

    grunt.registerTask('test', [
        'jshint',
        'mochacli'
    ]);

    grunt.registerTask('package', [
        'easy_rpm'
    ]);

    grunt.registerTask('release', [
        'easy_rpm',
        'nexusDeployer'
    ]);

};