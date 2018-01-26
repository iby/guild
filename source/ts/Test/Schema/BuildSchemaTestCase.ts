/// <reference path="../../../../dependency/typings/reference.d.ts" />
/// <reference path="../../../dts/reference.d.ts" />

import {Schema} from '../../Constant/Schema';
import {Validator} from '../../Validator/Validator';

require('should');

suite('build schema', function () {
    suite('less', function () {
        let validator: Validator = new Validator();
        let schema: string = Schema.BUILD_LESS;

        let validData: any[] = [
            {description: 'true', value: true},
            {description: '{source}', value: {source: 'foo'}},
            {description: '{destination}', value: {destination: 'foo'}},
            {description: '{destination[]}', value: {destination: ['foo', 'bar']}},
            {description: '{source, destination}', value: {source: 'foo', destination: 'bar'}}
        ];

        validData.forEach(function (data: any) {
            test(data.description, function () {
                validator.validate(data.value, schema).errors.should.be.empty();
            });
        });
    });

    suite('twig', function () {
        let validator: Validator = new Validator();
        let schema: string = Schema.BUILD_TWIG;

        let validData: any[] = [
            {description: 'true', value: true},
            {description: '{data}', value: {data: {}}},
            {description: '{source}', value: {source: 'foo'}},
            {description: '{destination}', value: {destination: 'foo'}},
            {description: '{destination[]}', value: {destination: ['foo', 'bar']}},
            {description: '{data, source, destination}', value: {data: {}, source: 'foo', destination: 'bar'}}
        ];

        validData.forEach(function (data: any) {
            test(data.description, function () {
                validator.validate(data.value, schema).errors.should.be.empty();
            });
        });
    });

    suite('webpack', function () {
        let validator: Validator = new Validator();
        let schema: string = Schema.BUILD_WEBPACK;

        let validData: any[] = [
            {description: '{configuration}', value: {configuration: {}}},
            {description: '{source}', value: {source: 'foo'}},
            {description: '{destination}', value: {destination: 'foo'}},
            {description: '{destination[]}', value: {destination: ['foo', 'bar']}},
            {description: '{configuration, source, destination}', value: {configuration: {}, source: 'foo', destination: 'bar'}}
        ];

        validData.forEach(function (data: any) {
            test(data.description, function () {
                validator.validate(data.value, schema).errors.should.be.empty();
            });
        });
    });
});