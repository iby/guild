'use strict';

var Validator = require('jsonschema').Validator;

/**
 * @constructor
 * @returns {Validator}
 */
function SchemaValidator() {
    var validator = new Validator();

    validator.addSchema(require('../../json/Schema/BuildLessSchema.json'));
    validator.addSchema(require('../../json/Schema/BuildTwigSchema.json'));
    validator.addSchema(require('../../json/Schema/BuildWebpackSchema.json'));
    validator.addSchema(require('../../json/Schema/DependencyCleanSchema.json'));
    validator.addSchema(require('../../json/Schema/DependencyNormaliseSchema.json'));
    validator.addSchema(require('../../json/Schema/DeployS3Schema.json'));
    validator.addSchema(require('../../json/Schema/PathMultiSchema.json'));
    validator.addSchema(require('../../json/Schema/PathUniSchema.json'));

    return validator;
}

module.exports = SchemaValidator;