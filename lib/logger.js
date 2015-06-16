var winston = require('winston');

var getLabel = function(module) {
    return module.filename.split('/').pop();
};

module.exports = {
    init: function(config, module) {
        var logger = new winston.Logger({
            transports: [
                new winston.transports.Console({
                    silent: config.winston.silent,
                    level: config.winston.level,
                    colorize: config.winston.colorize,
                    timestamp: config.winston.timestamp,
                    prettyPrint: config.winston.prettyPrint,
                    showLevel: config.winston.showLevel,
                    debugStdout: config.winston.debugStdout,
                    handleExceptions: config.winston.handleExceptions,
                    label: getLabel(module)
                })
            ]
        });

        return logger;
    }
};