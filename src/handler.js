let links = {
    'test-example': 'https://example.com',
    'test-expired': {
        url: 'https://example.com',
        expiresAt: '1970-01-01',
    },
    'test-invalid': {
        foo: 'bar'
    },
};
// LINKS_HERE

function getLinkRecord(linkId) {
    const linkRecord = links[linkId] ?? null;
    if (linkRecord) {
        return {
            url: typeof linkRecord === 'string' ? linkRecord : linkRecord.url,
            expiresAt: typeof linkRecord === 'object' ? linkRecord.expiresAt : null,
        }
    }
    return null;
}

function linkHasExpired(redirect) {
    return redirect.expiresAt && redirect.expiresAt < (new Date()).toISOString();
}

function linkMessageResponse(linkId, code, message, error) {
    console.log(JSON.stringify({ linkId, code, message, url: null, error }));
    return {
        statusCode: code,
        body: `<html><body><p>${code} - ${message}</p></body></html>`,
        statusDescription: '',
        headers: {
            'content-type': {
                value: 'text/html',
            }
        }
    }
}

function linkRedirectResponse(linkId, url) {
    console.log(JSON.stringify({
        linkId: linkId,
        code: 302,
        message: 'Redirect',
        url,
        error: null,
    }));
    return {
        statusCode: 302,
        statusDescription: '',
        headers: {
            location: {
                value: url
            },
            'x-robots-tag': {
                value: 'noindex',
            }
        }
    }
}

function handler(event) {
    let linkId = null;
    let linkRecord = null;
    try {
        linkId = event.request.uri.replace(/(^\/)/i, '');

        if (linkId === '') {
            return linkMessageResponse('', 422, 'Link not provided');
        }

        linkRecord = getLinkRecord(linkId);
        if (linkRecord) {
            if (linkHasExpired(linkRecord)) {
                return linkMessageResponse(linkId, 410, 'Link no longer available');
            }
            if (typeof linkRecord.url === 'string') {
                return linkRedirectResponse(linkId, linkRecord.url);
            }
            throw new Error('Link record found but invalid');
        }
        return linkMessageResponse(linkId, 404, 'Link not found');
    } catch (e) {
        return linkMessageResponse(linkId, 500, 'Internal error', e);
    }
}

module.exports = { handler };