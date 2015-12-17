'use strict';

/**
 * Represents the possible return values of typeof.
 *
 * @readonly
 * @enum {string}
 */
var DataType = {
    UNDEFINED: 'undefined',
    NULL: 'object',
    BOOLEAN: 'boolean',
    NUMBER: 'number',
    STRING: 'string',
    FUNCTION: 'function',
    XML: 'xml',
    XML_LIST: 'xml',
    OBJECT: 'object'
};

module.exports = DataType;