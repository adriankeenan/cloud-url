import {readFileSync} from "fs";
import {LinkRecords} from "./cloud-url-stack";
import Ajv from "ajv";

export function readLinksFromFile(): LinkRecords {
        const data = JSON.parse(readFileSync('./links.json').toString());

        const schema = {
            type: 'object',
            additionalProperties: {
                type: ['string', 'object'],
                properties: {
                    url: {
                        type: 'string',
                    },
                    expiresAt: {
                        type: ['null', 'string'],
                    },
                },
                required: ['url'],
                additionalProperties: false
            },
        };

        const ajv = new Ajv();
        const validate = ajv.compile(schema);
        const valid = validate(data);
        if (!valid) {
            throw new Error(`Failed to validate links.json\n${JSON.stringify(validate.errors, null, 4)}`);
        }

        return data as LinkRecords;
    }