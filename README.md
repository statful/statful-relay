Statful Relay
=============
[npm-url]: https://npmjs.org/package/statful-relay
[npm-image]: https://badge.fury.io/js/statful-relay.svg

[![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/statful/statful-relay.svg?branch=master)](https://travis-ci.org/statful/statful-relay)

Staful Relay built in NodeJS. This is intended to gather metrics from different sources inside the same network and relays it to a centralized system.

## Table of Contents

* [Supported NodeJS Versions](#supported-nodejs-versions)
* [Installation](#installation)
* [Quick Start](#quick-start)
* [Examples](#examples)
* [Reference](#reference)
* [Authors](#authors)
* [License](#license)

## Supported NodeJS Versions

| Statful Collector AWS Version | Tested NodeJS versions  |
|:---|:---|
| 1.x.x | `4` and `Stable` |

## Installation

```bash
$ npm install -g statful-relay
```

## Quick start

After installing Statful Relay you are ready to use it. The quickest way is to do the following:

```bash
$ statful-relay generate-config /etc/statful-relay/conf/

# Update some info in the statful-relay-conf.json: statful api token

$ statful-relay start /etc/statful-relay/conf/statful-relay-conf.json
```

## Examples

You can find here an usage example of the Statful Relay. In the following example are assumed you have already installed the collector globally and followed the [Quick Start](#quick-start).

### Use a listener for statful metrics and sends them to the public api

```json
{
  "debug": false,
  "listeners": {
    "statful": {
      "port": 2013,
      "address": "127.0.0.1",
      "ipv6": false,
      "stats": false
    }
  },
  "statfulClient": {
    "app": "statful-relay",
    "tags": {
       "env": "readme",
    },
    "transport": "api",
    "api": {
      "token": "STATFUL_API_TOKEN",
      "timeout": 2000,
      "host": "api.statful.com", // Default value
      "port": 443 // Default value
    },
    "flushSize": 1000,
    "flushInterval": 3000,
    "systemStats": false
  },
  "bunyan": {
    "name": "stdout",
    "streams": []
  }
}
```

## Reference

Detailed reference if you want to take full advantage from Statful Relay.

### CLI

```bash
$ statful-relay generate-config <path>
```

Creates a default configuration at the given path. If the given path doesn't exists, it will be created.

```bash
$ statful-relay start <path>
```

Starts the relay with the config on given path.

```bash
$ statful-relay start-managed <path>
```

Starts the relay managed by pm2 with the config on given path.

```bash
$ statful-relay stop-managed
```

Stops the relay managed by pm2.

```bash
$ statful-relay restart-managed
```

Restarts the relay managed by pm2.

```bash
$ statful-relay help
```

Shows a small help for the collector.

### Configuration

In the configuration file you can find three main sections: `debug, listeners, statfulClient and bunyan`.

**Debug**
If enabled, Statful-Relay will expose an Http Server on port 9000 to download heapdumps and show the memory in usage.

| Route | Description | Type |
|:---|:---|:---|
| /heapdump | Download heapdump. | `gzip` |
| /memory | Shows the memory in usage. | `string` |


**Listeners**

At the moment we only support one kind of listener called `statful`. However, here are the reference for listeners.

| Option | Description | Type | Default | Required |
|:---|:---|:---|:---|:---|
| _address_ | Defines the address where the listener should wait for data. | `string` | **none** | **YES** |
| _ipv6_ | Defines where the address' listener is ipv6. | `boolean` | **none** | **YES** |
| _port_ | Define the port where the listener should wait for data. | `number` | **none** | **YES** |
| _stats_ |  Defines if the listener's metric stats should be sent. | `boolean` | **none** | **YES** |

**Statful Client**

| Option | Description | Type | Default | Required |
|:---|:---|:---|:---|:---|
| _app_ | Defines the application global name. If specified sets a global tag `app=setValue`. | `string` | **none** | **NO** |
| _default_ | Object to set methods options. | `object` | `{}` | **NO** |
| _api_ | Defined API configurations. | `object` | **none** | **NO** |
| _dryRun_ | Defines if metrics should be output to the logger instead of being send. | `boolean` | `false` | **NO** |
| _systemStats_ | Enables sending metrics with flush stats. | `boolean` | `true` | **NO** |
| _flushInterval_ | Defines the periodicity of buffer flushes in **miliseconds**. | `number` | `3000` | **NO** |
| _flushSize_ | Defines the maximum buffer size before performing a flush. | `number` | `1000` | **NO** |
| _namespace_ | Defines the global namespace. | `string` | `application` | **NO** |
| _sampleRate_ | Defines the rate sampling. **Should be a number between [1, 100]**. | `number` | `100` | **NO** |
| _tags_ | Defines the global tags. | `object` | `{}` | **NO** |
| _transport_ | Defines the transport layer to be used to send metrics.<br><br> **Valid Transports:** `udp, api` | `string` | **none** | **YES** |
| _host_ | Defines the host name to where the metrics should be sent. Can also be set inside _api_. | `string` | `127.0.0.1` | **NO** |
| _path_ | Defines the api path to where the metrics should be sent. Can also be set inside _api_. | `string` | `/tel/v2.0/metric` | **NO** |
| _port_ | Defines the port. Can also be set inside _api_. | `string` | `2013` | **NO** |
| _token_ | Defines the token to be used.  Must be set inside _api_. | `string` | **none** | **NO** |
| _timeout_ | Defines the timeout for the transport layers in **miliseconds**. Must be set inside _api_. | `number` | `2000` | **NO** |

To get help and information about this specific options please read the [Statful Client NodeJS documentation](https://github.com/statful/statful-client-nodejs).

**Bunyan**

| Option | Description | Type | Default | Required |
|:---|:---|:---|:---|:---|
| _name_ | Defines the logger name. | `string` | **none** | **YES** |
| _level_ | Defines the global output level. | `string` | **none** | **NO** |
| _streams_ | Define the logger streams. By default, when the value is an empty array, logger will output to `proccess.stdout`. | `array` | `[]` | **YES** |

> **NOTE:** We had only documented some bunyan config fields here but you can set all the supported configs by Bunyan.


## Authors

[Mindera - Software Craft](https://github.com/Mindera)

## License

Statful Collector AWS is available under the MIT license. See the [LICENSE](https://raw.githubusercontent.com/statful/statful-collector-aws/master/LICENSE) file for more information.
