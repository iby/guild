'use strict';

var del = require('del');
var execSync = require('child_process').execSync;
var fs = require('fs');
var fse = require('fs-extra');
var gulp = require('gulp');
var path = require('path');
var sequence = require('run-sequence');

//

gulp.task('clean', false, function () {
    var paths = [
        '../product/js',
        '../product/json',
        '../product/package.json'
    ];

    del(paths, {force: true});
});

//

gulp.task('build', function () {

    // Build typescript sources.

    execSync('tsc');

    // Copy and update package.json configuration.

    var configuration = JSON.parse(fs.readFileSync(path.join(__dirname, '../dependency/package.json')));

    configuration = Object.assign(configuration, {
        main: 'js/index.js',
        typings: 'js/index.d.ts'
    });

    fs.writeFileSync(path.join(__dirname, '../product/package.json'), JSON.stringify(configuration, null, '    '));

    // Copy readme.

    fse.copySync('../README.md', '../product/README.md');
    fse.copySync('../source/json', '../product/json');
});

gulp.task('default', function () {
    return sequence.apply(null, ['clean', 'build'])
});