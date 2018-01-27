import {ValidatorResult} from 'jsonschema';
import jsonschema = require('jsonschema');

export class Validator extends jsonschema.Validator {
    constructor() {
        super();

        this.addSchema(require('../../json/Schema/BuildLessSchema.json'));
        this.addSchema(require('../../json/Schema/BuildTwigSchema.json'));
        this.addSchema(require('../../json/Schema/BuildWebpackSchema.json'));
        this.addSchema(require('../../json/Schema/DependencyCleanSchema.json'));
        this.addSchema(require('../../json/Schema/DependencyNormaliseSchema.json'));
        this.addSchema(require('../../json/Schema/DeployS3Schema.json'));
        this.addSchema(require('../../json/Schema/PathSchema.json'));
    }

    validate(instance: any, schema: any, options?: any, context?: any): ValidatorResult {
        let throwError: boolean = false;

        if (options != null && options.throwError) {
            throwError = true;
            options.throwError = false;
        }

        let result: ValidatorResult = super.validate(instance, schema, options, context);

        if (throwError && result.errors.length > 0) {
            throw Error(String(result.errors));
        }

        return result;
    }
}