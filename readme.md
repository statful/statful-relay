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
  "listeners": {
    "statful": {
      "port": 2013,
      "address": "127.0.0.1",
      "ipv6": false,
      "stats": false
    }
  },
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
$ statful-relay help
```

Shows a small help for the collector.

### Configuration

In the configuration file you can find three main sections: `listeners, statfulClient and bunyan`.

**Listeners**

At the momment we only support one kind of listener called `statful`. However, here are the reference for listeners.

| Option | Description | Type | Default | Required |
|:---|:---|:---|:---|:---|
| _address_ | Defines the address where the listener should wait for data. | `string` | **none** | **YES** |
| _ipv6_ | Defines where the address' listener is ipv6. | `boolean` | **none** | **YES** |
| _port_ | Define the port where the listener should wait for data. | `number` | **none** | **YES** |
| _stats_ |  Defines if the listener's metric stats should be sent. | `boolean` | **none** | **YES** |

**Statful Client**

| Option | Description | Type | Default | Required |
|:---|:---|:---|:---|:---|
| _api_ | Defined API configurations. Inside of it you should configure `token (required), timeout, host and port`. | `object` | **none** | **NO** |
| _app_ | Defines the application global name. | `string` | **none** | **YES** |
| _flushInterval_ | Defines the periodicity of buffer flushes in **miliseconds**. | `number` | `3000` | **NO** |
| _flushSize_ | Defines the maximum buffer size before performing a flush. | `number` | `1000` | **NO** |
| _systemStats_ | Defines if client should send its own system statistics. | `boolean` | `false` | **NO** |
| _tags_ | Defines the global tags to send along with own relay metrics. | `object` | `{}` | **NO** |
| _transport_ | Defines the transport layer to be used to send metrics.</br></br> **Valid Transports:** `udp, api` | `string` | **none** | **YES** |

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