import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';

export type OutputSetProps = {
    values: Record<string, string>;
};

export class OutputSet extends Construct {
    public outputs: Record<string, CfnOutput>;

    constructor(scope: Construct, id: string, props: OutputSetProps) {
        super(scope, id);

        this.outputs = {};
        Object.entries(props.values).forEach(([key, value]) => {
            this.outputs[key] = new CfnOutput(this, `Output-${key}`, {
                key,
                value,
            });
        });
    }
}
