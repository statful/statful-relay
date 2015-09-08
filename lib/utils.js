var async = require('async');

module.exports = {

    /**
     * Calculates the list of valid hosts based on them having had the InfluxDB created
     *
     * @param hosts
     * @param cb
     */
    filterValidHosts: function (hosts, cb) {
        async.filterSeries(hosts,
            function (item, itemCallback) {
                if (item.db_created) {
                    itemCallback(true);
                } else {
                    itemCallback(false);
                }
            },
            cb
        );
    },

    clusterHosts: function (hosts, db_name, flushInterval, maxBufferSize) {
        var clusterHosts = [];
        hosts.forEach(function (host) {
            clusterHosts.push({
                'host': host.host,
                'port': host.port,
                'db_name': db_name,
                'version': host.version,
                'db_created': false,
                'flushInterval' : flushInterval,
                'maxBufferSize' : maxBufferSize
            });
        });

        return clusterHosts;
    }
};