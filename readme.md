
Telemetron's NodeJS implementation of carbon-tagger. It listens to metrics on a port (default _2003_), parses
the metric for tags and stores the results on elastic search.

Metrics are held in memory where de-duplication occurs to minimize writes to Elastic Search. This uses an LRU cache.


Base on the prefix of each metric, carbon-tagger will select which backend to write into. The backends are selected
from the TEL service (http://bitbucket.com).

To minimize the Elasticsearch writes, the system will update it's in-memory index by retreiving all metric ids from the various
Elasticsearch backends. However, please note that it will only load up data for backends for which is has received metrics already.
The goal with this is to only load up metrics from the backends that this carbon-tagger is mean to be writing into and not all the backends
in the system.


Run
====

    npm install
    grunt serve


Build & Packaging
=================

The build uses Mindera's automated build system and the pipeline configuration is defined in _.jenkins/main.yml_




