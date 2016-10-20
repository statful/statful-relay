module.exports = {
    schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    properties: {
        listeners: {
            type: 'object',
            properties: {
                statful: {
                    type: 'object',
                    properties: {
                        port: {
                            type: 'integer',
                            minimum: 1024,
                            maximum: 65535
                        },
                        address: {
                            type: 'string'
                        },
                        ipv6: {
                            type: 'boolean'
                        },
                        stats: {
                            type: 'boolean'
                        }
                    },
                    required: ['port', 'address', 'ipv6', 'stats']
                }
            },
            required: ['statful']
        },
        statfulClient: {
            type: 'object',
            properties: {
                app: {
                    type: 'string',
                    required: true
                },
                tags: {
                    type: 'object'
                },
                transport: {
                    type: 'string',
                    enum: ['api', 'udp'],
                    required: true
                },
                api: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string'
                        },
                        timeout: {
                            type: 'integer',
                            minimum: 1
                        },
                        host: {
                            type: 'string'
                        },
                        port: {
                            type: 'integer',
                            minimum: 1024,
                            maximum: 65535
                        }
                    },
                    required: ['token']
                },
                flushInterval: {
                    type: 'integer',
                    minimum: 1
                },
                flushSize: {
                    type: 'integer',
                    minimum: 1
                },
                systemStats: {
                    type: 'boolean'
                }
            },
            required: ['app', 'transport', 'api']
        },
        bunyan: {
            type: 'object',
            properties: {
                name: {
                    type: 'string'
                },
                streams: {
                    type: 'array'
                }
            },
            required: ['name', 'streams']
        }

    },
    required: ['listeners', 'statfulClient', 'bunyan']
};