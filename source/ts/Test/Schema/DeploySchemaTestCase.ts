/// <reference path="../../../../dependency/typings/reference.d.ts" />
/// <reference path="../../../dts/reference.d.ts" />

import {Schema} from '../../Constant/Schema';
import {Validator} from '../../Validator/Validator';

require('should');

suite('deploy schema', function () {
    suite('s3', function () {
        let validator: Validator = new Validator();
        let schema: string = Schema.DEPLOY_S3;

        let validData: any[] = [
            {description: 'path', value: 'foo'},
            {description: 'path[]', value: ['foo', 'bar']},
            {description: '{path,base}', value: {path: 'foo'}},
            {description: '{path[],base}', value: {path: ['foo', 'bar'], base: 'root'}},
            {description: '{path}[]', value: [{path: 'foo'}, {path: 'bar'}]},
            {description: '{target,bucket}', value: {target: ['foo', {path: ['bar', 'baz'], base: 'root'}], bucket: 'tst'}}
        ];

        validData.forEach(function (data: any) {
            test(data.description, function () {
                validator.validate(data.value, schema, {throwError: true}).errors.should.be.empty();
            });
        });
    });
});