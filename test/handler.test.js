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
            "statusCode": 307,
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

    it('merges incoming query params into redirect url when appendQueryParams is true', () => {
        const event = {
            request: {
                uri: 'test-append-params',
                querystring: {
                    existing: { value: 'new' },
                    extra: { value: 'yes' },
                }
            }
        };
        expect(handler(event)).toEqual({
            "headers": {
                "location": {
                    "value": "https://example.com?existing=new&extra=yes"
                },
                "x-robots-tag": {
                    "value": "noindex",
                },
            },
            "statusCode": 307,
            "statusDescription": ""
        });
    });

    it('leaves redirect url unchanged when appendQueryParams is true but no query params', () => {
        const event = {
            request: {
                uri: 'test-append-params',
            }
        };
        expect(handler(event)).toEqual({
            "headers": {
                "location": {
                    "value": "https://example.com?existing=1"
                },
                "x-robots-tag": {
                    "value": "noindex",
                },
            },
            "statusCode": 307,
            "statusDescription": ""
        });
    });

    it('does not forward query params when appendQueryParams is not set', () => {
        const event = {
            request: {
                uri: 'test-example',
                querystring: {
                    foo: { value: 'bar' },
                }
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
            "statusCode": 307,
            "statusDescription": ""
        });
    });
});