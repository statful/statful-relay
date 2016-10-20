var bunyan = require('bunyan');

var Logger = (function () {
    var _logger;
    var _config;

    function createLogger(config) {
        _config = config;
        _logger = bunyan.createLogger(
            {
                name: _config.bunyan.name,
                streams: getBunyanStreams(_config.bunyan)
            }
        );
    }

    function getBunyanStreams(bunyanConfig) {
        var streams = bunyanConfig.streams;

        if (streams.length === 0) {
            var streamsLevel = bunyanConfig.level ? bunyanConfig.level : 'info';

            streams.push({
                level: streamsLevel,
                stream: process.stdout
            });
        }
        return streams;
    }

    return {
        sharedLogger: function (config) {
            if (!_logger) {
                _logger = createLogger(config);
            }
            return _logger;
        }
    };
})();

module.exports = Logger;