module.exports = {
    schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    properties: {
        statfulServer: {
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
                }
            },
            required: ['port', 'address', 'ipv6']
        },
        collectdServer: {
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
                }
            },
            required: ['port', 'address', 'ipv6']
        },
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
    required: ['statfulServer', 'collectdServer', 'app', 'transport', 'api']
};