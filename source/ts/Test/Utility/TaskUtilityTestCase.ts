/// <reference path="../../../../dependency/typings/reference.d.ts" />
/// <reference path="../../../dts/reference.d.ts" />

import {TaskUtility} from '../../Utility/TaskUtility';

import path = require('path');
import should = require('should');

suite('task utility', function () {
    test('get common extension', function () {
        var sourcePath:string = path.join(__dirname, '../../../../test/project/source');

        TaskUtility.getCommonExtension(path.join(sourcePath, 'js/*')).should.equal('js');
        TaskUtility.getCommonExtension(['foo.js', 'bar.js']).should.equal('js');
        TaskUtility.getCommonExtension(['**/*.js', '*.js']).should.equal('js');

        should.not.exist(TaskUtility.getCommonExtension(path.join(sourcePath, '**.*')));
        should.not.exist(TaskUtility.getCommonExtension(['*.js', '*.css']));
    });

    test('get common directory', function () {
        // Todo: var sourcePath:string = path.join(__dirname, '../../../../test/project/source');

        TaskUtility.getCommonDirectory('foo/bar').should.equal('foo');
        TaskUtility.getCommonDirectory(['foo/bar', 'foo/baz']).should.equal('foo');

        should.not.exist(TaskUtility.getCommonDirectory(['foo', 'bar']));
        should.not.exist(TaskUtility.getCommonDirectory(['foo/bar', 'bar/baz']));
    });

    test('get directory', function () {
        // Todo: var sourcePath:string = path.join(__dirname, '../../../../test/project/source');

        TaskUtility.getDirectory('foo/bar').should.eql(['foo']);
        TaskUtility.getDirectory(['foo/bar', 'foo/baz']).should.eql(['foo', 'foo']);
        TaskUtility.getDirectory(['foo/bar', 'bar/baz']).should.eql(['foo', 'bar']);

        should.not.exist(TaskUtility.getDirectory(['foo', 'bar']));
    });
});