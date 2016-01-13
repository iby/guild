import {execSync} from 'child_process';

import del = require('del');
import fs = require('fs');
import fse = require('fs-extra');
import gulp = require('gulp');
import path = require('path');
import sequence = require('run-sequence');

/**
 * Clean products.
 */
gulp.task('clean', function () {
    var paths = [
        '../product/documentation',
        '../product/js',
        '../product/json',
        '../product/package.json'
    ];

    return del(paths, {force: true});
});

/**
 * Build products.
 */
gulp.task('build', function () {

    // Build typescript sources.

    execSync('tsc');

    // Copy and update package.json configuration.

    var configuration = JSON.parse(<any>fs.readFileSync(path.join(__dirname, '../dependency/package.json')));

    configuration = (<any>Object).assign(configuration, {
        main: 'js/index.js',
        typings: 'js/index.d.ts'
    });

    fs.writeFileSync(path.join(__dirname, '../product/package.json'), JSON.stringify(configuration, null, '    '));

    // Copy readme.

    fse.copySync('../documentation', '../product/documentation');
    fse.copySync('../README.md', '../product/README.md');
    fse.copySync('../source/json', '../product/json');
});

gulp.task('default', function () {
    return sequence.apply(null, ['clean', 'build'])
});