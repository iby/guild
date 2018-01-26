/// <reference path="../../../../dependency/typings/reference.d.ts" />
/// <reference path="../../../dts/reference.d.ts" />

import {Schema} from '../../Constant/Schema';
import {Validator} from '../../Validator/Validator';

require('should');

suite('dependency schema', function () {
    suite('normalise', function () {
        let validator: Validator = new Validator();
        let schema: string = Schema.DEPENDENCY_NORMALISE;

        let validData: any[] = [
            {description: 'path', value: 'foo'},
            {description: '{source}', value: {source: 'foo'}},
            {description: '{destination}', value: {destination: 'foo'}},
            {description: '{plugins}', value: {plugins: []}},
            {description: '{source, destination, plugins}', value: {source: 'foo', destination: 'bar', plugins: []}},
        ];

        validData.forEach(function (data: any) {
            test(data.description, function () {
                validator.validate(data.value, schema).errors.should.be.empty();
            });
        });
    });
});