/// <reference path='../../../../../dependency/typings/reference.d.ts' />
/// <reference path='../../../../dts/reference.d.ts' />

import {SourceFile} from '../../../Testing/File';
import {LessFactory, LessConfiguration} from '../../../Task/Build/LessFactory';
import {PathConfiguration} from '../../../Configuration/PathConfiguration';
import {Pipeline} from '../../../Stream/Pipeline';
import {Task as TaskName} from '../../../Constant/Task';
import {Task} from '../../../Task/Build/AbstractFactory';

import path = require('path');
import help = require('gulp-help');

require('should');

suite('build less task factory', function () {
    var pathConfiguration:PathConfiguration = new PathConfiguration('../../../../../test/project');

    test('construct pipeline', function () {
        var lessConfiguration:LessConfiguration = {destination: null, source: null};
        var configuration:any = [lessConfiguration, pathConfiguration];
        var factory:LessFactory = new LessFactory();
        var [head, tail]:Pipeline = factory.constructPipeline([lessConfiguration, pathConfiguration]);

        tail.once('data', function (file:SourceFile) {
            path.basename(file.path).should.equal('style.css');
        });

        head.write(<any>SourceFile.less('style.less'));
    });

    test('construct task', function () {
        var lessConfiguration:any = {clean: true, destination: null, source: null, watch: true};
        var configuration:any = [lessConfiguration, pathConfiguration];
        var factory:LessFactory = new LessFactory();

        factory.configuration = configuration;
        factory.gulp = help(require('gulp'));
        factory.parameters = <any>{};

        var [builds, cleans, watches]:Task = factory.construct();

        builds.should.eql([TaskName.BUILD_LESS]);
        cleans.should.eql([TaskName.BUILD_LESS_CLEAN]);
        watches.should.eql([TaskName.BUILD_LESS_WATCH]);
    });
});