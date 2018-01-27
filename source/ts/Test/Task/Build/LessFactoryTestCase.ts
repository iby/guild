import 'mocha';
import 'should';

import {SourceFile} from '../../../Testing/File';
import {LessConfiguration, LessFactory} from '../../../Task/Build/LessFactory';
import {PathConfiguration} from '../../../Configuration/PathConfiguration';
import {Pipeline} from '../../../Stream/Pipeline';
import {Task as TaskName} from '../../../Constant/Task';
import {Task} from '../../../Task/Build/AbstractFactory';
import path = require('path');
import help = require('gulp-help');

suite('build less task factory', function () {
    let pathConfiguration: PathConfiguration = new PathConfiguration('../../../../../test/project');

    test('construct pipeline', function () {
        let lessConfiguration: LessConfiguration = {destination: null, source: null};
        let configuration: any = [lessConfiguration, pathConfiguration];
        let factory: LessFactory = new LessFactory();
        let [head, tail]: Pipeline = factory.constructPipeline(lessConfiguration);

        tail.once('data', function (file: SourceFile) {
            path.basename(file.path).should.equal('style.css');
        });

        head.write(<any>SourceFile.less('style.less'));
    });

    test('construct task', function () {
        let lessConfiguration: any = {clean: true, destination: null, source: null, watch: true};
        let configuration: any = [lessConfiguration, pathConfiguration];
        let factory: LessFactory = new LessFactory();

        factory.configuration = configuration;
        factory.gulp = help(require('gulp'));
        factory.parameters = <any>{};

        let [builds, cleans, watches]: Task = factory.construct();

        builds.should.eql([TaskName.BUILD_LESS]);
        cleans.should.eql([TaskName.BUILD_LESS_CLEAN]);
        watches.should.eql([TaskName.BUILD_LESS_WATCH]);
    });
});