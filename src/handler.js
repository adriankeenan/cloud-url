let links = {
    'test-example': 'https://example.com',
    'test-expired': {
        url: 'https://example.com',
        expiresAt: '1970-01-01',
    },
    'test-invalid': {
        foo: 'bar'
    },
    'test-append-params': {
        url: 'https://example.com?existing=1',
        appendQueryParams: ['existing', 'extra'],
    },
};
// LINKS_HERE

function getLinkRecord(linkId) {
    const linkRecord = links[linkId] ?? null;
    if (linkRecord) {
        return {
            url: typeof linkRecord === 'string' ? linkRecord : linkRecord.url,
            expiresAt: typeof linkRecord === 'object' ? linkRecord.expiresAt : null,
            appendQueryParams: typeof linkRecord === 'object' && Array.isArray(linkRecord.appendQueryParams) ? linkRecord.appendQueryParams : [],
        }
    }
    return null;
}

function appendQueryParams(targetUrl, querystring, allowedParams) {
    if (!querystring || allowedParams.length === 0) return targetUrl;
    const qs = Object.entries(querystring)
        .filter(([k]) => allowedParams.includes(k))
        .map(([k, d]) => `${encodeURIComponent(k)}=${encodeURIComponent(d.value)}`)
        .join('&');
    return qs ? targetUrl + (targetUrl.includes('?') ? '&' : '?') + qs : targetUrl;
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
        code: 307,
        message: 'Redirect',
        url,
        error: null,
    }));
    return {
        statusCode: 307,
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
                const targetUrl = appendQueryParams(linkRecord.url, event.request.querystring, linkRecord.appendQueryParams);
                return linkRedirectResponse(linkId, targetUrl);
            }
            throw new Error('Link record found but invalid');
        }
        return linkMessageResponse(linkId, 404, 'Link not found');
    } catch (e) {
        return linkMessageResponse(linkId, 500, 'Internal error', e);
    }
}

module.exports = { handler };