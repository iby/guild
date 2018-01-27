import {CompileStream, Project} from 'gulp-typescript';
import {TaskFunction} from 'gulp';
import {TsConfig} from 'gulp-typescript/release/types';
import del = require('del');
import gulp = require('gulp');
import json = require('gulp-json-editor');
import merge = require('merge-stream');
import sequence = require('run-sequence');
import tsc = require('gulp-typescript');
import ReadWriteStream = NodeJS.ReadWriteStream;

/**
 * Clean products.
 */
gulp.task('clean', function (): ReadWriteStream {
    let paths: string[] = [
        '../product/*.json',
        '../product/*.md',
        '../product/documentation',
        '../product/js',
        '../product/json',
        '../product/ts'
    ];

    return del(paths, {force: true}) as any;
});

/**
 * Build products.
 */
gulp.task('build', function (): ReadWriteStream {
    let project: Project = tsc.createProject('tsconfig.json');
    let configuration: TsConfig = project.config;

    // Must update package details that goes into product for npm deployment.

    let packagePatch: Object = {
        main: 'js/index.js',
        typings: 'ts/index.d.ts'
    };

    // Compile typescript to product, copy any associated files there too.

    let compileStream: CompileStream = <CompileStream>gulp.src(configuration.files.concat(['../source/ts/**/*.ts'])).pipe(project());
    let fileStream: ReadWriteStream = merge(
        gulp.src('../dependency/package.json').pipe(json(packagePatch)).pipe(gulp.dest('../product')),
        gulp.src(['../documentation/**/*', '../README.md'], {base: '..'}).pipe(gulp.dest('../product')),
        gulp.src(['../source/json/**/*'], {base: '../source'}).pipe(gulp.dest('../product')));

    // Merge the two output streams, so this task is finished when the IO of both operations are done.

    return merge(
        compileStream.dts.pipe(gulp.dest('../product/ts')),
        compileStream.js.pipe(gulp.dest('../product/js')),
        fileStream);
});

// Todo: rewrite with decent `--watch` cli option.

gulp.task('watch', ['default'], function () {
    gulp.watch('../source/ts/**/*.ts', ['build'] as any);
});

gulp.task('default', function (callback: TaskFunction): ReadWriteStream {
    return sequence('clean', 'build', callback);
});