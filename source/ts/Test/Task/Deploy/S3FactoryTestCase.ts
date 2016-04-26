/// <reference path='../../../../../dependency/typings/reference.d.ts' />
/// <reference path='../../../../dts/reference.d.ts' />

import {PathConfiguration} from '../../../Configuration/PathConfiguration';
import {S3Factory} from '../../../Task/Deploy/S3Factory';
import {Parameter} from '../../../Constant/Parameter';

import path = require('path');
import help = require('gulp-help');

require('should');

suite('s3 task factory', function () {
    var pathConfiguration:PathConfiguration = new PathConfiguration(path.join(__dirname, '../../../../../test/project'));
    var parameters:any = {};

    var awsConfiguration:any = {
        accessKeyId: parameters[Parameter.ACCESS_KEY] = 'ack',
        secretAccessKey: parameters[Parameter.SECRET_KEY] = 'sck',
        params: {
            Bucket: parameters[Parameter.BUCKET] = 'bct'
        }
    };

    test('normalise empty configuration', function () {
        var factory:S3Factory = new S3Factory();
        var s3Configuration:any = {};

        (function () {
            factory.normaliseConfigurations([s3Configuration, pathConfiguration], <any>{});
        }).should.throw();
    });

    test('normalise simple configuration, array of path strings', function () {
        var factory:S3Factory = new S3Factory();
        var s3Configuration:any = ['foo', 'bar'];

        [s3Configuration] = factory.normaliseConfigurations([s3Configuration, pathConfiguration], parameters);

        s3Configuration.should.eql([
            {target: [{path: 'foo'}], configuration: awsConfiguration, plugins: null},
            {target: [{path: 'bar'}], configuration: awsConfiguration, plugins: null}
        ]);
    });

    test('normalise simple configuration, array of path objects', function () {
        var factory:S3Factory = new S3Factory();
        var s3Configuration:any = [{path: 'foo/bar', base: 'foo'}, {path: 'bar/baz'}];

        [s3Configuration] = factory.normaliseConfigurations([s3Configuration, pathConfiguration], parameters);

        s3Configuration.should.eql([
            {target: [{path: 'foo/bar', base: 'foo'}], configuration: awsConfiguration, plugins: null},
            {target: [{path: 'bar/baz'}], configuration: awsConfiguration, plugins: null}
        ]);
    });
});