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
        this.addSchema(require('../../json/Schema/PathMultiSchema.json'));
        this.addSchema(require('../../json/Schema/PathUniSchema.json'));
    }
}