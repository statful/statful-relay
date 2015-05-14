var logger = require('./logger'),
    l;


module.exports = {


    processMetricLine: function (config) {

        l = new logger.Logger(config.log || {});

        l.log("Tagger up and running on " + config.port);

        /**
         * Parse metric and send tags to elastic search in the format:
         * {
         *  _type: "metric",
         *  _id: "telemetry...",
         *  tags: [ ],
         *  }
         *
         *  Select backend based on the prefix of the metric and the results from
         *  the TEL service: http://tel.mindera/tel/v1.0/accounts
         */
        return function _processMetricLine(line) {

            // TODO: When storing on elasticsearch, remember to do buffering and de-duplication
            // as elastic search probably won't be able to take the write frequency that
            // the carbon tagger will receive


            l.log(line);
        };
    }

};