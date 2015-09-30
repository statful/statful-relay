var logger = require('./logger'),
    udp = require('./udp'),
    metricParser = require('telemetry-metric-language'),
    agg = {};

/**
 * Sorts the aggregated values
 *
 * @param metric
 */
function sortAggValues(metric) {
    if (!metric.values_sorted) {
        metric.values_sorted = metric.values.sort(function (a, b) {
            return a - b;
        });
    }
}

/**
 * Returns the percentile of a certain aggregated metric
 *
 * @param metric
 * @param percentile
 * @returns {T|*}
 */
function getPercentile(metric, percentile) {
    var pIndex = Math.floor(Math.abs(percentile) / 100 * metric.values.length);
    sortAggValues(metric);
    return metric.values_sorted[pIndex];
}

/**
 * Commit metrics to the upstream system
 *
 * @param metrics
 * @param prefix
 * @param l
 */
function commitMetric(metrics, prefix, telemetron, l) {
    var flushLines;
    if (metrics && metrics.length > 0) {
        flushLines = metrics.map(function(metric) {
            return prefix + '.' + metric.name + ' ' + metric.points[0][1] + ' ' + metric.points[0][0];
        });

        l.debug('Flushed metrics:' + flushLines);
        telemetron.putRaw(flushLines);
        telemetron.inc('metrics_flushed', flushLines.length);
    }
}

/**
 * Process the in-memory metrics and flush the aggregated results to the upstream system
 *
 * @param aggKey
 * @param l
 * @param telemetron
 */
function processAndFlushAggregations(aggKey, l, telemetron) {
    var metricsToCommit = [],
        ag = agg[aggKey],
        metricNames = Object.keys(ag.metrics),
        start = new Date().getTime(),
        now = parseInt(start / 1000);

    if (metricNames.length === 0) {
        clearInterval(ag.timer);
        delete agg[aggKey];
        l.info(aggKey + ': removing timer for metric aggregation');
    } else {
        metricNames.forEach(function (name) {
            var metric = ag.metrics[name],
                flushMetricName;


            metric.agg.types.forEach(function (type) {

                switch (type) {
                    case 'p95':
                        metric.p95 = getPercentile(metric, 95);
                        break;
                    case 'p90':
                        metric.p90 = getPercentile(metric, 90);
                        break;
                }

                // append the aggregation name and frequency to the metric name
                flushMetricName = name.split(',');
                flushMetricName[0] = flushMetricName[0] + '.' + type  + '_' + metric.agg.frequency + 's';

                metricsToCommit.push({
                    'name': flushMetricName,
                    'columns': ['time', 'value'],
                    'points': [
                        [now, metric[type]]
                    ]
                });
            });
        });

        // clear the metrics for the next run
        ag.metrics = {};

        l.info(aggKey + ': commit aggregated metrics: ' + metricsToCommit.length);
        commitMetric(metricsToCommit, ag.prefix, telemetron, l);
        telemetron.time('metrics_aggregation_processing', new Date().getTime() - start, {
            prefix: aggKey.split(':')[0],
            frequency: aggKey.split(':')[1]
        }, ['avg', 'p95']);
    }
}

/**
 * Produces the in-memory metric aggregation
 *
 * @param metric
 */
function aggregateMetric(metric, metricName, l, telemetron) {
    var f = metric.agg.frequency,
        aggKey = metric.prefix + ':' + f,
        counter_increment = 1 / (metric.agg.sample ? metric.agg.sample / 100 : 1),
        m;
    if (!agg[aggKey]) {
        agg[aggKey] = {
            metrics: {},
            prefix: metric.prefix,
            timer: setInterval(processAndFlushAggregations, f * 1000, aggKey, l, telemetron)
        };
        l.info(aggKey + ': created timer for metric aggregation');
    }

    if (!agg[aggKey].metrics[metricName]) {
        agg[aggKey].metrics[metricName] = metric;
        agg[aggKey].metrics[metricName].values = [];
    }

    m = agg[aggKey].metrics[metricName];

    m.values.push(metric.value);

    // count and sum are always calculated but not necessarily flushed
    m.sum = (m.sum ? m.sum + metric.value * counter_increment : metric.value * counter_increment);
    m.count = (m.count ? m.count + counter_increment : counter_increment);

    // calculate the aggregations that can be computed on the fly as metrics arrive
    metric.agg.types.forEach(function (type) {
        switch (type) {
            case 'avg':
                m.avg = m.sum / m.count;
                break;
            case 'count_ps':
                m.count_ps = m.count / f;
                break;
            case 'min':
                if (!m.min || metric.value < m.min) {
                    m.min = metric.value;
                }
                break;
            case 'max':
                if (!m.max || metric.value > m.max) {
                    m.max = metric.value;
                }
                break;
            case 'first':
                if (!m.first) {
                    m.first = metric.value;
                }
                break;
            case 'last':
                m.last = metric.value;
                break;
        }
    });

}


/**
 * Builds up a function to process incoming metrics
 *
 * @param config
 * @returns {Function}
 */
function processMetricLine(config, telemetron) {

    var l = logger.init(config, module);

    var processMetric = function (metric) {

        var metricName = metric.name,
            metricToCommit;

        if (metric.tags) {
            metricName += ',' + metric.tags.map(function (m) {
                return m.name + '=' + m.value;
            }).join(',');
        }

        if (metric.agg) {
            aggregateMetric(metric, metricName, l, telemetron);
        } else {
            metricToCommit = [{
                'name': metricName,
                'columns': ['time', 'value'],
                'points': [
                    [metric.time, metric.value]
                ]
            }];
            commitMetric(metricToCommit, metric.prefix, telemetron, l);
        }

    };

    return function _processMetricLines(lines) {

        var linesList, start = new Date().getTime();

        lines = lines.toString();

        if (lines && typeof lines === 'string') {
            linesList = lines.split('\n');
            telemetron.inc('metrics_received', linesList.length);
            linesList.forEach(function (metricLine) {
                var parsedMetric;

                if (metricLine) {
                    try {
                        parsedMetric = metricParser.parse(metricLine);
                        processMetric(parsedMetric);
                    } catch (e) {
                        l.error('Error processing metric:' + metricLine + ' ' + e);
                    }


                }
            });
            telemetron.time('metrics_processing', new Date().getTime() - start, null, ['avg', 'p95']);
        }
    };
}

var Relay = function (config, telemetron) {
    this.config = config;
    this.telemetron = telemetron;
};

Relay.prototype.start = function () {
    udp.start(this.config.udp.port, this.config.udp.address, this.config.udp.ipv6,
        processMetricLine(this.config, this.telemetron));
};

Relay.prototype.stop = function () {
    udp.stop();
};

module.exports = Relay;