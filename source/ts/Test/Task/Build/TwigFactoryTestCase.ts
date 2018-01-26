/// <reference path='../../../../../dependency/typings/reference.d.ts' />
/// <reference path='../../../../dts/reference.d.ts' />

import {SourceFile} from '../../../Testing/File';
import {PathConfiguration} from '../../../Configuration/PathConfiguration';
import {Pipeline} from '../../../Stream/Pipeline';
import {Task as TaskName} from '../../../Constant/Task';
import {Task} from '../../../Task/Build/AbstractFactory';
import {TwigFactory, TwigConfiguration} from '../../../Task/Build/TwigFactory';

import path = require('path');
import help = require('gulp-help');

require('should');

suite('build twig task factory', function () {
    let twigConfiguration: TwigConfiguration = {destination: null, source: null};
    let pathConfiguration: PathConfiguration = new PathConfiguration('../../../../../test/project');
    let configuration: any = [twigConfiguration, pathConfiguration];

    test('construct pipeline', function () {
        let factory: TwigFactory = new TwigFactory();
        let [head, tail]: Pipeline = factory.constructPipeline(twigConfiguration);

        tail.once('data', function (file: SourceFile) {
            path.basename(file.path).should.equal('template.html');
        });

        head.write(<any>SourceFile.twig('template.twig'));
    });

    test('construct task', function () {
        let twigConfiguration: TwigConfiguration = {clean: true, destination: null, source: null, watch: true};
        let configuration: any = [twigConfiguration, pathConfiguration];
        let factory: TwigFactory = new TwigFactory();

        factory.configuration = configuration;
        factory.gulp = help(require('gulp'));
        factory.parameters = <any>{};

        let [builds, cleans, watches]: Task = factory.construct();

        builds.should.eql([TaskName.BUILD_TWIG]);
        cleans.should.eql([TaskName.BUILD_TWIG_CLEAN]);
        watches.should.eql([TaskName.BUILD_TWIG_WATCH]);
    });
});