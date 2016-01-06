import {DataType} from './Constant/DataType';
import {Deploy, Guild, PluginGenerator, S3Target} from './Configuration/Guild';
import {GulpHelp} from 'gulp-help';
import {Parameter} from './Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {Path} from './Configuration/Path';
import {Plugin} from './Constant/Plugin';
import {Schema} from './Constant/Schema';
import {Readable} from 'stream';
import {TaskUtility} from './Utility/TaskUtility';
import {Task} from './Constant/Task';
import {Validator} from './Validator/Validator';

import awspublish = require('gulp-awspublish');
import merge = require('merge-stream');
import path = require('path');
import rename = require('gulp-rename');
import sequence = require('run-sequence');
import url = require('url');

function createDeployS3Task(gulp:GulpHelp, configuration:Deploy, parameters:ParsedArgs, cleanTasks:string[], deployTasks:string[]) {
    var s3Configuration = configuration.s3;
    var pathConfiguration = configuration.path;

    // Normalise configuration.

    typeof s3Configuration === DataType.STRING && (s3Configuration = [s3Configuration]);
    Array.isArray(s3Configuration) && (s3Configuration = {'': s3Configuration});

    deployTasks.push(Task.DEPLOY_S3);
    gulp.task(Task.DEPLOY_S3, function () {
        var streams:Readable[] = [];

        Object.keys(s3Configuration).forEach(function (bucket) {
            var bucketConfiguration:S3Target = s3Configuration[bucket];
            var source:string|string[];
            var plugins:any[]|PluginGenerator;

            var accessKey:string;
            var baseUrl:string;
            var certificateAuthority:string;
            var pathStyle:string;
            var region:string;
            var secretKey:string;
            var index:number;

            if (typeof bucketConfiguration === DataType.STRING || Array.isArray(bucketConfiguration)) {
                source = <string>bucketConfiguration;
            } else {
                source = bucketConfiguration.source;
                plugins = bucketConfiguration.plugins;
                accessKey = bucketConfiguration.accessKey;
                baseUrl = bucketConfiguration.baseUrl;
                certificateAuthority = bucketConfiguration.certificateAuthority;
                pathStyle = bucketConfiguration.pathStyle;
                region = bucketConfiguration.region;
                secretKey = bucketConfiguration.secretKey;
            }

            // Check bucket.

            bucket === '' && (bucket = parameters[Parameter.BUCKET]);
            parameters[bucket + '-' + Parameter.BUCKET] == null || (bucket = parameters[bucket + '-' + Parameter.BUCKET]);

            // If configuration didn't come with the bucket try getting it from parameters.

            accessKey == null && (accessKey = parameters[Parameter.ACCESS_KEY]);
            baseUrl == null && (baseUrl = parameters[Parameter.BASE_URL]);
            certificateAuthority == null && (certificateAuthority = parameters[Parameter.CERTIFICATE_AUTHORITY]);
            pathStyle == null && (pathStyle = parameters[Parameter.PATH_STYLE]);
            region == null && (region = parameters[Parameter.REGION]);
            secretKey == null && (secretKey = parameters[Parameter.SECRET_KEY]);

            if (bucket == null || bucket == '') {
                throw new Error('No bucket…');
            } else if (accessKey == null) {
                throw new Error('Cannot upload assets without knowing the aws access key.');
            } else if (secretKey == null) {
                throw new Error('Cannot upload assets without knowing the aws secret key.');
            }

            var awsConfiguration:any = {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
                params: {Bucket: bucket}
            };

            // If base url is specified it means we are dealing with something other than AWS' S3, like Riak CS. Other configuration
            // is matched as closely as it can be…

            baseUrl == null || (awsConfiguration['endpoint'] = url.parse(baseUrl).host);
            certificateAuthority == 'system' && (awsConfiguration['sslEnabled'] = false);
            pathStyle == null || (awsConfiguration['s3ForcePathStyle'] = pathStyle);
            region == null || (awsConfiguration['region'] = region);

            // Normalise plugins.

            (plugins == null || (<any[]>plugins).length === 0) && (plugins = [Plugin.DEFAULT]);
            (index = (<any[]>plugins).indexOf(Plugin.DEFAULT)) >= 0 && (<any[]>plugins).splice(index, 1, Plugin.NORMALISE);
            (index = (<any[]>plugins).indexOf(Plugin.NORMALISE)) >= 0 && (<any[]>plugins).splice(index, 1);

            // Normalise sources, they may contain all sort of shit as we about to find out.

            var sources:string[] = Array.isArray(source) ? source : [source];

            sources.forEach(function (source) {
                var base = path.join(configuration.path.product, 'html');
                var pipeline = gulp.src(source, {base: base}).pipe(TaskUtility.createPlumber());

                pipeline = pipeline
                    .pipe(rename(function (path) {
                        path.dirname = '/' + path.dirname
                    }))
                    .pipe(awspublish.create(awsConfiguration).publish(null, {force: true}))
                    .pipe(awspublish.reporter({}));

                streams.push(pipeline);
            });
        });

        return merge.apply(null, streams);
    });
}

export function deploy(gulp:GulpHelp, configuration:Guild, parameters:ParsedArgs) {
    var deployConfiguration:Deploy = configuration.deploy;
    var pathConfiguration:Path = configuration.path;
    var validator = new Validator();

    // Inject stuff into deploy configuration.

    deployConfiguration.path = pathConfiguration;

    // Gulp help stuff.

    var description:string = 'Clean and build dependencies into local libraries.';
    var options:any = {
        production: 'Build for production, will minify and strip everything it can. Very slow.',
        watch: 'Watch files for changes to re-run.'
    };
    var taskOptions:any = {
        clean: 'Clean dependencies.',
        deploy: 'Normalise dependencies.'
    };

    var cleanTasks:string[] = [];
    var dependencyTasks:string[] = [];
    var generators:any = {
        s3: createDeployS3Task
    };

    Object.keys(deployConfiguration).forEach(function (key:string) {
        var generator:Function = generators[key];
        var schema:string = (<any>Schema)['DEPLOY_' + key.toUpperCase()];

        if (generator != null && schema != null && validator.validate(deployConfiguration[key], schema, {throwError: true})) {
            generator(gulp, deployConfiguration, parameters, cleanTasks, dependencyTasks);
            options[key] = taskOptions[key];
        }
    });

    gulp.task(Task.DEPLOY, description, function (callback:Function) {
        var tasks:any[] = [];

        cleanTasks.length > 0 && tasks.push(cleanTasks);
        dependencyTasks.length > 0 && tasks.push.apply(tasks, dependencyTasks);

        if (tasks.length === 0) {
            throw new Error('No tasks were configured, make sure your configuration is correct.');
        } else {
            tasks.push(callback);
        }

        return sequence.use(gulp).apply(null, tasks);
    }, {options: options});
}