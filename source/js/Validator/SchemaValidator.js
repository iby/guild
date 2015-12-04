'use strict';

var Validator = require('jsonschema').Validator;

function SchemaValidator() {
    var validator = new Validator();

    validator.addSchema(require('../../json/Schema/PathUniSchema.json'));
    validator.addSchema(require('../../json/Schema/PathMultiSchema.json'));
    validator.addSchema(require('../../json/Schema/BuildLessSchema.json'));
    validator.addSchema(require('../../json/Schema/BuildWebpackSchema.json'));

    return validator;
}

module.exports = SchemaValidator;