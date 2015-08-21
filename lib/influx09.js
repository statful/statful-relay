var querystring = require("querystring"),
    http = require('http');

module.exports = {

    createDB: function (destination, account, logger) {

        logger.info("Attempting to create DB [" + destination.db_name + "] ");

        var options = {
            hostname: destination.host,
            port: destination.port,
            method: 'GET',
            path: '/query?' + querystring.stringify({'q': 'CREATE DATABASE ' + destination.db_name})
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
                    logger.info("Created DB [" + destination.db_name + "] ");
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
                path: '/write?rp=default&precision=ms&db=' + destination.db_name
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
                } else {
                    logger.error('Error flushing metrics: ' + flushLines);
                }
            });
        });

        req.write(flushLines);
        req.end();

    }

};
