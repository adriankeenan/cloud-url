import {aws_cloudfront, aws_logs, Stack, StackProps, Tags} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
    AllowedMethods,
    CfnDistribution,
    CfnFunction, Distribution,
    FunctionEventType,
    HttpVersion,
    ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import {HttpOrigin} from "aws-cdk-lib/aws-cloudfront-origins";
import {OutputSet} from "./constructs/output-set";
import {CfnLogGroup, LogGroup, RetentionDays} from "aws-cdk-lib/aws-logs";
import {readFileSync} from "fs";
import {default as links} from '../links.json';

export type LinkRecords = {
    [key: string]: string | { url: string, expiresAt: string|null }
};

type CloudUrlStackProps = StackProps & {
    stage?: string,
}

export class CloudUrlStack extends Stack {

    stage: string;

    constructor(scope: Construct, id: string, props?: CloudUrlStackProps) {

        if (props?.stage == null) {
            throw new Error('stage context value not set');
        }

        super(scope, id, {
            ...props,
            stackName: `CloudUrl-${props?.stage}`,
            env: {
                // Force us-east-1 as this is our only option if we want to control the log group :-/
                region: 'us-east-1',
            }
        });

        this.stage = props.stage;

        // Tag all resources
        Tags.of(this).add('STAGE', this.stage);

        const functionName = `CloudUrl-Redirect-${this.stage}`;

        const logGroup = this.createLogGroup(functionName);

        const redirectFn = this.createRedirectFunction(functionName, logGroup, links);

        const distribution = this.createDistribution(redirectFn);

        new OutputSet(this, 'Outputs', {
            values: {
                distributionId: distribution.distributionId,
                distributionUrl: `https://${distribution.distributionDomainName}`,
                linkCount: Object.keys(links).length.toString(),
                logGroup: logGroup.logGroupName,
            },
        })
    }

    createLogGroup(functionName: string): LogGroup {
        const logGroup = new aws_logs.LogGroup(this, 'LogGroup', {
            retention: RetentionDays.THREE_MONTHS,
            logGroupName: `/aws/cloudfront/function/${functionName}`,
        });
        (logGroup.node.defaultChild as CfnLogGroup).overrideLogicalId('LogGroup');
        return logGroup;
    }

    createRedirectFunction(functionName: string, logGroup: LogGroup, links: LinkRecords): aws_cloudfront.Function {

        const functionCode = readFileSync('./src/handler.js').toString()
            // Strip module.exports (required to test the function)
            .replace(/module.exports = { (.*) };/i, '')
            // Inject the link records
            .replace('// LINKS_HERE', `links = Object.assign(links, ${JSON.stringify(links)});`);

        const redirectFn = new aws_cloudfront.Function(this, 'Function', {
            functionName,
            comment: 'CloudUrl redirect viewer function',
            code: aws_cloudfront.FunctionCode.fromInline(functionCode),
            runtime: aws_cloudfront.FunctionRuntime.JS_2_0,
        });
        // Create the function after the log group, forcing AWS to use the log group we created, rather than creating
        // one automatically
        redirectFn.node.addDependency(logGroup);
        (redirectFn.node.defaultChild as CfnFunction).overrideLogicalId('Function');

        return redirectFn;
    }

    createDistribution(redirectFn: aws_cloudfront.Function): Distribution {
        const distribution = new aws_cloudfront.Distribution(this, 'CfDistribution', {
            comment: `CloudUrl distribution - ${this.stage}`,
            defaultBehavior: {
                // CF needs to exist in front of _something_, so we'll use a random domain that will never exist
                origin: new HttpOrigin('not-real.invalid'),
                functionAssociations: [
                    {
                        function: redirectFn,
                        eventType: FunctionEventType.VIEWER_REQUEST,
                    }
                ],
                allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
            },
            httpVersion: HttpVersion.HTTP2_AND_3,
        });
        (distribution.node.defaultChild as CfnDistribution).overrideLogicalId('CfDistribution');

        return distribution;
    }
}
