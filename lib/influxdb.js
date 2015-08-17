var influx = {
    '0.8': require('./influx08'),
    '0.9': require('./influx09')
};


module.exports = {

    createDB: function (destination, account, logger) {
        return influx[destination.version].createDB(destination, account, logger);
    },

    flushMetrics: function (destination, metrics, logger) {
        return influx[destination.version].flushMetrics(destination, metrics, logger);
    }

};