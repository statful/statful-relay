/**
 * Parse metric lines such as:
 * telemetron.application.response_time,xxx_xAS=y,zsfsd_f=aa_aa 232434.43 1441644168 sum,count,60 10
 * <prefix>.<metric name>,<tags: not mandatory> <value> <timestamp> <aggregations: not mandatory> <sample rate: not mandatory>
 */

//
// This grammar is used to generate the parser to parse the targets requested to graphite.
//
// Use http://pegjs.org/online to test the grammar if you need to make any changes
//


Start
  = prefix:PREFIX DOT name:NAME tags:TAGS? value:FLOAT time:FLOAT agg:AGGREGATION? {
     var result = { 
        prefix: prefix,
        name: name,
        value: value,
        time: time,
     }
     if (tags) {
        result.tags = tags;
     }
     if (agg) {
        result.agg = agg;
     }
     
    return result;
}

SAMPLERATE = SPACE s:[0-9]+ {
   var result = parseInt(s.join(""), 10);
   return (result > 0 && result < 100) ? result : false;
}

AGGREGATION = SPACE first:AGG rest:(COMMA a:AGG { return a; })* f:FREQ  sample:SAMPLERATE? {
   var result;
   rest.unshift(first);
   result = {
     types: rest,
     frequency: f,
     sample: sample ? sample : 100
   };

   return result;
}

AGG = ('sum' / 'avg' / 'count\_ps' / 'count' / 'first' / 'last' / 'p90' / 'p95' / 'min' / 'max')

FREQ = COMMA f:('10' / '15' / '30' / '60' / '300') {
   return parseInt(f);
}

TAGS = COMMA first:TAG rest:(COMMA m:TAG { return m; })* {
       rest.unshift(first);
       return rest;
}

TAG = name1:[a-zA-Z] name2:[a-zA-Z_0-9]+ EQUALS value:[a-zA-Z_0-9]+ {
      return {name:name1 + name2.join(""), value:value.join("")};
}



PREFIX = w:[a-zA-Z]* {
    return w.join("") 
}


NAME = first:[a-zA-Z]+rest:[a-zA-Z0-9_\-\.]* { 
    return first.join("") + rest.join("") 
}

FLOAT = SPACE n:[0-9]+ d:(DOT v:[0-9]+ {v.unshift('.'); return v;})? { 
    return parseFloat(n.join("") + (d ? d.join("") : ''))
}

// TOKENS
SPACE = " "
COMMA = ","
EQUALS = "="
DOT = "."