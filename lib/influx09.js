var querystring = require("querystring"),
    http = require('http');

module.exports = {

    createDB: function (destination, account, logger) {

        logger.info("Attempting to create DB [" + account + "] ");

        var options = {
            hostname: destination.host,
            port: destination.port,
            method: 'GET',
            path: '/query?' + querystring.stringify({'q': 'CREATE DATABASE ' + account})
        };

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var responseText = "";

            res.on('data', function (body) {
                responseText += body;
            });

            res.on('end', function () {
                // Mark the DB as created if the Response Code is: Created or Conflict
                if (this.statusCode == 200 || this.statusCode == 201 || this.statusCode == 409) {
                    destination.db_created = true;
                }
            });
        });

        req.end();

    },

    flushMetrics: function (destination, metrics, logger) {


        var options = {
                hostname: destination.host,
                port: destination.port,
                method: 'POST',
                path: '/write?db=' + destination.db_name
            },
            flushLines = metrics.map(function (m) {
                return m.points.map(function (p) {
                    return m.name + ' value=' + p[1] + ' ' + p[0]
                }).join("\n");
            }).join("\n");

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            var responseText = "";

            res.on('data', function (body) {
                responseText += body;
            });

            res.on('end', function () {
                if (this.statusCode == 200 || this.statusCode == 204) {
                    logger.debug('Flush metrics: ' + flushLines);
                }
            });
        });

        req.write(flushLines);
        req.end();

    }

};