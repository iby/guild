import 'mocha';

import {PathUtility} from '../../Utility/PathUtility';
import path = require('path');
import should = require('should');

suite('path utility', function () {
    test('get common extension', function () {
        let sourcePath: string = path.join(__dirname, '../../../../test/project/source');

        PathUtility.getCommonExtension(path.join(sourcePath, 'js/*')).should.equal('js');
        PathUtility.getCommonExtension(['foo.js', 'bar.js']).should.equal('js');
        PathUtility.getCommonExtension(['**/*.js', '*.js']).should.equal('js');

        should.not.exist(PathUtility.getCommonExtension(path.join(sourcePath, '**.*')));
        should.not.exist(PathUtility.getCommonExtension(['*.js', '*.css']));
    });

    test('get common directory', function () {
        // Todo: let sourcePath:string = path.join(__dirname, '../../../../test/project/source');

        PathUtility.getCommonDirectory('foo/bar').should.equal('foo');
        PathUtility.getCommonDirectory(['foo/bar', 'foo/baz']).should.equal('foo');

        should.not.exist(PathUtility.getCommonDirectory(['foo', 'bar']));
        should.not.exist(PathUtility.getCommonDirectory(['foo/bar', 'bar/baz']));
    });

    test('get directory', function () {
        // Todo: let sourcePath:string = path.join(__dirname, '../../../../test/project/source');

        PathUtility.getDirectory('foo/bar').should.eql(['foo']);
        PathUtility.getDirectory(['foo/bar', 'foo/baz']).should.eql(['foo', 'foo']);
        PathUtility.getDirectory(['foo/bar', 'bar/baz']).should.eql(['foo', 'bar']);

        should.not.exist(PathUtility.getDirectory(['foo', 'bar']));
    });

    test('globalise path', function () {
        // Todo: let sourcePath:string = path.join(__dirname, '../../../../test/project/source');

        PathUtility.globalisePath('foo', '*', true).should.eql('foo/*');
        PathUtility.globalisePath('foo/bar', '*', true).should.eql('foo/bar/*');
        PathUtility.globalisePath('foo/bar.baz', '*', true).should.eql('foo/bar.baz');
    });

    test('normalise path', function () {
        PathUtility.normalisePath('/foo', 'bar').should.eql('/foo/bar');
        PathUtility.normalisePath('/foo', '/bar').should.eql('/bar');
        PathUtility.normalisePath('/foo', '!bar').should.eql('!/foo/bar');
        PathUtility.normalisePath('/foo', '!/bar').should.eql('!/bar');
    });
});