
The Telemetron Relay can be used to process metric aggregation before sending them to the centralized storage system. This relay only ingests
metrics via UDP.


Run
====

    npm install
    grunt serve
    
Run integration tests
=====================

    grunt integration-test
    
Run performance tests
=====================

This is still __WIP__. But you can start doing some tests against a host and observe the metrics against a Telemetron instance.

## Running the Telemetron suite

    grunt performance-test --targetHost 172.28.128.4 --testSuite telemetron
    
## Running the Collectd suite

    grunt performance-test --targetHost 172.28.128.4 --testSuite collectd
    
## Configuring the tests

Options:

* --testSuite _suite_ __The test suite to run (default: telemetron)__
* --targetHost _host_ __The host to where the tests will run against (required)__
* --telemetronPort _port_ __The UDP port to send Telemetron metrics (default: 2013)__
* --collectdPort _port_ __The UDP port to send Collectd metrics (default: 2023)__
* --durationMs _duration_ __The duration of the test in millis (default: 60000)__
* --clientsCount _count_ __The The number of clients to simulate (default: 200)__
* --metricsPerRequest _count_ __The number of metrics to send on each request (default: 70)__
* --cycleDurationMs _duration_ __The duration of each client cycle between sends in millis (default: 10000)__


Build & Packaging
=================

The build uses Mindera's automated build system and the pipeline configuration is defined in _.jenkins/main.yml_




