/// <reference path='../../../../../dependency/typings/reference.d.ts' />
/// <reference path='../../../../dts/reference.d.ts' />

import {NormaliseFactory, NormaliseConfiguration} from '../../../Task/Dependency/NormaliseFactory';
import {PathConfiguration} from '../../../Configuration/PathConfiguration';
import {Pipeline} from '../../../Stream/Pipeline';
import {SourceFile, DependencyFile} from '../../../Testing/File';

import path = require('path');
import help = require('gulp-help');

require('should');

suite('dependency normalise task factory', function () {
    let pathConfiguration: PathConfiguration = new PathConfiguration(path.join(__dirname, '../../../../../test/project'));
    let parameters: any = {};

    test('normalise empty configuration', function () {
        let factory: NormaliseFactory = new NormaliseFactory();
        let normaliseConfiguration: any = {};

        [normaliseConfiguration] = factory.normaliseConfigurations([normaliseConfiguration, pathConfiguration], parameters);

        normaliseConfiguration.should.be.instanceOf(Array).and.be.empty();
    });

    test('normalise simple configuration', function () {
        let factory: NormaliseFactory = new NormaliseFactory();
        let normaliseConfiguration: any = {'foo': 'script.js'};

        [normaliseConfiguration] = factory.normaliseConfigurations([normaliseConfiguration, pathConfiguration], parameters);

        normaliseConfiguration.should.be.instanceOf(Array).and.eql([{
            destination: path.join(pathConfiguration.library, 'js/foo.js'),
            plugins: null,
            source: path.join(pathConfiguration.dependency, 'script.js')
        }]);
    });

    test('normalise complex configuration', function () {
        let factory: NormaliseFactory = new NormaliseFactory();
        let normaliseConfiguration: any = [{source: 'style.css', destination: 'foo'}];

        [normaliseConfiguration] = factory.normaliseConfigurations([normaliseConfiguration, pathConfiguration], parameters);

        normaliseConfiguration.should.be.instanceOf(Array).and.eql([{
            destination: path.join(pathConfiguration.library, 'css/foo.css'),
            plugins: null,
            source: path.join(pathConfiguration.dependency, 'style.css')
        }]);
    });

    test('construct css pipeline', function () {
        let normaliseConfiguration: NormaliseConfiguration = {source: null, destination: 'foo'};
        let factory: NormaliseFactory = new NormaliseFactory();
        let [head, tail]: Pipeline = factory.constructPipeline(normaliseConfiguration);

        tail.once('data', function (file: SourceFile) {
            path.basename(file.path).should.equal('style.css');
        });

        head.write(<any>DependencyFile.css('style.css'));
    });

    test('construct js pipeline', function () {
        let normaliseConfiguration: NormaliseConfiguration = {source: null, destination: 'foo'};
        let factory: NormaliseFactory = new NormaliseFactory();
        let [head, tail]: Pipeline = factory.constructPipeline(normaliseConfiguration);

        tail.once('data', function (file: SourceFile) {
            path.basename(file.path).should.equal('foo');
        });

        head.write(<any>DependencyFile.js('script.js'));
    });
});