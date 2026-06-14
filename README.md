# cloud-url

A CDK-managed URL-shortener implemented in a CloudFront viewer function

Features:
- 1-click deploy via AWS CDK
- ~100ms response time
- Link management via a JSON file
- Expiring links
- Request logging

Try it out [here](https://i.adriank.dev/cloud-url)

## Deploying

Bootstrap:
```
npm i
cdk bootstrap
```

Deploy:
```
cdk deploy --context stage=main
```

🎉 You can now access links at: `https://{cloudfront_distribution_id}/{link_id}`

🔗 The console output will contain the URL of the CloudFront distribution which uses
the redirect viewer function.

🌍 The region is locked to us-east-1, as this allows us to configure the function log group
from the CDK. 

⏳ CloudFront functions take ~5 minutes to deploy. The CDK deploy process is
synchronous, unlike the AWS console which processes function updates asynchronously. 

📄 You can deploy multiple instances by altering the `stage` context value.

## Managing links

Update [`links.json`](./links.json) and deploy!

Links can be added either in the format:
```javascript
{
    // Simple format, no expiration
    "LINK_ID": "URL",
    // Object format, with optional expiration
    "LINK_ID": {
        "url": "URL",
        "expiresAt": "ISO8601 date"
    }
}
```

## Querying logs

Logs are written to CloudWatch Logs. The log group name is output by CDK as `logGroup` and follows the pattern:

```
/aws/cloudfront/function/CloudUrl-Redirect-{stage}
```

All log entries are structured JSON with the fields `linkId`, `code`, `message`, `url`, and `error`.

### CloudWatch Logs Insights

Open [CloudWatch Logs Insights](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights) in the AWS console (region: `us-east-1`), select the log group, and run queries:

All recent requests:
```
fields @timestamp, linkId, code, message, url
| sort @timestamp desc
| limit 100
```

Requests for a specific link:
```
fields @timestamp, code, message, url
| filter linkId = "my-link-id"
| sort @timestamp desc
```

Non-redirect responses (errors, not found, expired):
```
fields @timestamp, linkId, code, message, error
| filter code != 307
| sort @timestamp desc
```

### AWS CLI

Tail recent log events (replace `{stage}` and adjust `--start-time` as needed):
```
aws logs filter-log-events \
  --region us-east-1 \
  --log-group-name /aws/cloudfront/function/CloudUrl-Redirect-{stage} \
  --start-time $(date -d '1 hour ago' +%s000) \
  --query 'events[].message' \
  --output text
```

## Tests

Run unit tests with `npm run test`

## License

[The Unlicense](./LICENSE)