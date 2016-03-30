/// <reference path='../../../../../dependency/typings/reference.d.ts' />
/// <reference path='../../../../dts/reference.d.ts' />

import {PathConfiguration} from '../../../Configuration/PathConfiguration';
import {Pipeline} from '../../../Stream/Pipeline';
import {SourceFile} from '../../../Testing/File';
import {Task as TaskName} from '../../../Constant/Task';
import {Task} from '../../../Task/Build/AbstractFactory';
import {WebpackFactory, WebpackConfiguration} from '../../../Task/Build/WebpackFactory';

import help = require('gulp-help');
import path = require('path');

require('should');

suite('build webpack task factory', function () {
    var webpackConfiguration:WebpackConfiguration = {destination: null, source: null};
    var pathConfiguration:PathConfiguration = new PathConfiguration('../../../../../test/project');
    var configuration:any = [webpackConfiguration, pathConfiguration];

    test('construct pipeline', function () {
        var factory:WebpackFactory = new WebpackFactory();
        var [head, tail]:Pipeline = factory.constructPipeline(webpackConfiguration);

        tail.once('data', function (file:SourceFile) {
            path.basename(file.path).should.equal('script.js');
        });

        head.write(<any>SourceFile.js('script.js'));
    });

    test('construct task', function () {
        var webpackConfiguration:WebpackConfiguration = {clean: true, destination: null, source: null, watch: true};
        var configuration:any = [webpackConfiguration, pathConfiguration];
        var factory:WebpackFactory = new WebpackFactory();

        factory.configuration = configuration;
        factory.gulp = help(require('gulp'));
        factory.parameters = <any>{};

        var [builds, cleans, watches]:Task = factory.construct();

        builds.should.eql([TaskName.BUILD_WEBPACK]);
        cleans.should.eql([TaskName.BUILD_WEBPACK_CLEAN]);
        watches.should.eql([TaskName.BUILD_WEBPACK_WATCH]);
    });
});