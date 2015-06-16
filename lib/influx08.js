var logger = require('./logger'),
    elasticsearch = require('elasticsearch'),
    querystring = require("querystring"),
    http = require('http');

module.exports = {

    createDB: function (destination, account, logger) {

        logger.info("Attempting to create DB [" + account + "] ");

        var options = {
            hostname: destination.host,
            port: destination.port,
            method: 'POST',
            path: '/db?u=root&p=root'
        };

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var responseText = "";

            res.on('data', function (body) {
                responseText += body;
            });

            res.on('end', function () {
                // Mark the DB as created if the Response Code is: Created or Conflict
                if (this.statusCode == 201 || this.statusCode == 409) {
                    destination.db_created = true;
                }
            });
        });

        req.write('{"name": "' + account + '"}');
        req.end();

    },

    flushMetrics: function (destination, metrics, logger) {


        var options = {
            hostname: destination.host,
            port: destination.port,
            method: 'POST',
            path: '/db/'+ destination.db_name +'/series?u=root&p=root'
        };

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var responseText = "";

            res.on('data', function (body) {
                responseText += body;
            });

            res.on('end', function () {
                if (this.statusCode == 200) {
                    logger.debug('Flush metrics: ' + JSON.stringify(metrics));
                }
            });
        });

        req.write(JSON.stringify(metrics));
        req.end();

    }

};