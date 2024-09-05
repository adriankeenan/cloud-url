const handler = require('../src/handler').handler

describe('handler', () => {

    it('returns error response when link not provided', () => {
        const event = {
            request: {
                uri: '/'
            }
        };
        expect(handler(event)).toEqual({
            "body": "<html><body><p>422 - Link not provided</p></body></html>",
            "headers": {
                "content-type": {
                    "value": "text/html"
                }
            },
            "statusCode": 422,
            "statusDescription": ""
        });
    });

    it('returns redirect response when link found and not expired', () => {
        const event = {
            request: {
                uri: 'test-example'
            }
        };
        expect(handler(event)).toEqual({
            "headers": {
                "location": {
                    "value": "https://example.com"
                },
                "x-robots-tag": {
                    "value": "noindex",
                },
            },
            "statusCode": 302,
            "statusDescription": ""
        });
    });

    it('returns not found response when link not found', () => {
        const event = {
            request: {
                uri: 'test-not-found'
            }
        };
        expect(handler(event)).toEqual({
            "body": "<html><body><p>404 - Link not found</p></body></html>",
            "headers": {
                "content-type": {
                    "value": "text/html"
                }
            },
            "statusCode": 404,
            "statusDescription": ""
        });
    });

    it('returns expired response when link found and not expired', () => {
        const event = {
            request: {
                uri: 'test-expired'
            }
        };
        expect(handler(event)).toEqual({
            "body": "<html><body><p>410 - Link no longer available</p></body></html>",
            "headers": {
                "content-type": {
                    "value": "text/html"
                }
            },
            "statusCode": 410,
            "statusDescription": ""

        });
    });

    it('returns error response when link found and not expired', () => {
        const event = {
            request: {
                uri: 'test-invalid'
            }
        };
        expect(handler(event)).toEqual({
            "body": "<html><body><p>500 - Internal error</p></body></html>",
            "headers": {
                "content-type": {
                    "value": "text/html"
                }
            },
            "statusCode": 500,
            "statusDescription": ""
        });
    });
});