/**
 * TODO - remove and re-use node-collectd fork on GitHub.
 *
 * Utilities for parsing the CollectD binary format. Adapted from the Python version by Adrian Perez.
 **/

var Parser = require("ctype").Parser;
var ctype = require("ctype");

// Message kinds
TYPE_HOST = 0x0000;
TYPE_TIME = 0x0001;
TYPE_PLUGIN = 0x0002;
TYPE_PLUGIN_INSTANCE = 0x0003;
TYPE_TYPE = 0x0004;
TYPE_TYPE_INSTANCE = 0x0005;
TYPE_VALUES = 0x0006;
TYPE_INTERVAL = 0x0007;
TYPE_TIME_HIRES = 0x0008;
TYPE_INTERVAL_HIRES = 0x0009;

// For notifications
TYPE_MESSAGE = 0x0100;
TYPE_SEVERITY = 0x0101;

// DS kinds
DS_TYPE_COUNTER = 0;
DS_TYPE_GAUGE = 1;
DS_TYPE_DERIVE = 2;
DS_TYPE_ABSOLUTE = 3;

/**
 * Collectd packets consist of parts, with each part starting with a 16 bit TYPE field, followed by a 16 bit LENGTH field. The length is the length of the part including the TYPE and LENGTH fields.
 **/
headerPacket = [{type: {type: 'uint16_t'}}, {length: {type: 'uint16_t'}}];

var ctypeParser = new Parser({endian: "big"});

// NOTE: The following is borrowed from node-ctype since it doesn't export them.
/*
 * Attempts to convert an array of two integers returned from rsint64 / ruint64
 * into an absolute 64 bit number. If however the value would exceed 2^52 this
 * will instead throw an error. The mantissa in a double is a 52 bit number and
 * rather than potentially give you a value that is an approximation this will
 * error. If you would rather an approximation, please see toApprox64.
 *
 *  val     An array of two 32-bit integers
 */
function toAbs64(val) {
    if (val === undefined)
        throw (new Error('missing required arg: value'));

    if (!(val instanceof Array))
        throw (new Error('value must be an array'));

    if (val.length != 2)
        throw (new Error('value must be an array of length 2'));

    /* We have 20 bits worth of precision in this range */
    if (val[0] >= 0x100000)
        throw (new Error('value would become approximated'));

    return (val[0] * Math.pow(2, 32) + val[1]);
}

/**
 * Will return the 64 bit value as returned in an array from rsint64 / ruint64
 * to a value as close as it can. Note that Javascript stores all numbers as a
 * double and the mantissa only has 52 bits. Thus this version may approximate
 * the value.
 *
 *  val     An array of two 32-bit integers
 */
function toApprox64(val) {
    if (val === undefined)
        throw (new Error('missing required arg: value'));

    if (!(val instanceof Array))
        throw (new Error('value must be an array'));

    if (val.length != 2)
        throw (new Error('value must be an array of length 2'));

    return (Math.pow(2, 32) * val[0] + val[1]);
}

function to64(val) {
    // Until I get around to writing a native extension, this will have to do
    try {
        return toAbs64(val);
    } catch (e) {
        return toApprox64(val);
    }
}

/**
 * Strings are by far the easiest thing to parse. Just the LENGTH - 4 bytes of characters, and that includes the null terminator.
 **/
function decode_network_string(msgtype, len, buf) {
    // This syntax is a bit strange, but it boils down to "Read a string of <len> length and return it in a field named 'content'"
    var nstring = ctypeParser.readData([{content: {type: "char[" + len + "]"}}], buf, 4);
    return nstring.content.toString("ascii", 0, len - 1);
}

/**
 * Numbers (which describe a few different part types) are just 64 bit big endian encoded.
 **/
function decode_network_number(msgtype, len, buf) {
    var nnumber = ctype.rsint64(buf, "big", 4);
    return to64(nnumber);
}

/**
 * Values are defined by a subtype, which is described in types.db
 **/
function decode_network_values(msgtype, len, buf) {
    var value_count = ctype.ruint16(buf, "big", 4);
    var results = [];
    var value_types = [];
    var offset = 6;
    var data_offset = offset + value_count;

    for (var i = 0; i < value_count; i++) {
        value_types.push(ctype.ruint8(buf, "big", offset + i));
    }

    var dsnames = [];
    var dstypes = [];
    var values = [];
    value_types.forEach(function (type, index) {
        switch (type) {
            case DS_TYPE_COUNTER:
                values.push(to64(ctype.ruint64(buf, "big", data_offset + (8 * index))));
                dstypes.push('counter');
                break;
            case DS_TYPE_ABSOLUTE:
                values.push(to64(ctype.ruint64(buf, "big", data_offset + (8 * index))));
                dstypes.push('absolute');
                break;
            case DS_TYPE_GAUGE:
                values.push(ctype.rdouble(buf, "little", data_offset + (8 * index)));
                dstypes.push('gauge');
                break;
            case DS_TYPE_DERIVE:
                values.push(to64(ctype.rsint64(buf, "big", data_offset + (8 * index))));
                dstypes.push('derive');
                break;
            default:
                throw new Error("Sorry, can't handle variable type " + type);
                break;
        }
        dsnames.push('value');

        results.push({dstypes: dstypes, values: values, dsnames: dsnames});
    });

    return results;
}

// Ugly and very much cribbed from the Python version
var decoders = [];
decoders[TYPE_HOST] = decode_network_string;
decoders[TYPE_PLUGIN] = decode_network_string;
decoders[TYPE_PLUGIN] = decode_network_string;
decoders[TYPE_PLUGIN_INSTANCE] = decode_network_string;
decoders[TYPE_TYPE] = decode_network_string;
decoders[TYPE_TYPE_INSTANCE] = decode_network_string;
decoders[TYPE_MESSAGE] = decode_network_string;
decoders[TYPE_TIME] = decode_network_number;
decoders[TYPE_INTERVAL] = decode_network_number;
decoders[TYPE_SEVERITY] = decode_network_number;
decoders[TYPE_TIME_HIRES] = decode_network_number;
decoders[TYPE_VALUES] = decode_network_values;
decoders[TYPE_INTERVAL_HIRES] = decode_network_number;

// Convert from the flat type->value array to something more object-based
function interpret_results(results) {
    var val_objects = [];
    var v = {};

    results.forEach(function (obj) {
        switch (obj[0]) {
            case TYPE_TIME:
                v.time = obj[1];
                break;
            case TYPE_TIME_HIRES:
                if (!v.time) {
                    v.time = fromHighResolution(obj[1]);
                }
                break;
            case TYPE_INTERVAL:
                v.interval = obj[1];
                break;
            case TYPE_INTERVAL_HIRES:
                if (!v.interval) {
                    v.interval = fromHighResolution(obj[1]);
                }
                break;
            case TYPE_HOST:
                v.host = obj[1];
                break;
            case TYPE_PLUGIN:
                v.plugin = obj[1];
                break;
            case TYPE_PLUGIN_INSTANCE:
                v.plugin_instance = obj[1];
                break;
            case TYPE_TYPE:
                v.type = obj[1];
                break;
            case TYPE_TYPE_INSTANCE:
                v.type_instance = obj[1];
                break;
            case TYPE_VALUES:
                // TODO - clean this
                v.dstypes = obj[1][0].dstypes;
                v.dsnames = obj[1][0].dsnames;
                v.values = obj[1][0].values;
                val_objects.push(clone(v));
                break;
            case TYPE_MESSAGE:
                v.message = obj[1];
                break;
            case TYPE_SEVERITY:
            default:
                // ignore fo now
                break;
        }
    });

    return val_objects;
}

function fromHighResolution(number) {
    return parseFloat(number / Math.pow(10, 9).toFixed(3));
}

function clone(obj) {
    var new_obj = {};
    Object.keys(obj).forEach(function (key) {
        new_obj[key] = obj[key];
    });
    return new_obj;
}

exports.collectd_parse = function decode_network_packet(buf) {
    var results = [];
    var offset = 0, blength = buf.length;
    while (offset < blength) {

        var header = ctypeParser.readData(headerPacket, buf, offset);
        var decoder = decoders[header.type];

        if (undefined !== decoder) {
            var value = decoder(header.type, header.length - 4, buf.slice(offset, offset + header.length));
            results.push([header.type, value]);
        } else {
            console.error("No handler for type " + header.type);
        }
        offset += header.length;
    }
    return interpret_results(results);
};