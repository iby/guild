'use strict';

/**
 * @name DeployConfiguration
 * @property {*} s3
 * @property {Path} path
 */

var DataType = require('./Constant/DataType');
var Parameter = require('./Constant/Parameter');
var Plugin = require('./Constant/Plugin');
var Schema = require('./Constant/Schema');
var SchemaValidator = require('./Validator/SchemaValidator');
var Task = require('./Constant/Task');

var awspublish = require('gulp-awspublish');
var merge = require('merge-stream');
var path = require('path');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sequence = require('run-sequence');
var url = require('url');

/**
 * @param {Gulp} gulp
 * @param {DeployConfiguration} configuration
 * @param {Object} parameters
 * @param {Array} cleanTasks
 * @param {Array} deployTasks
 */
function createDeployS3Task(gulp, configuration, parameters, cleanTasks, deployTasks) {

    /**
     * @name S3Target
     * @property {String} source
     * @property {String} plugins
     * @property {String} accessKey
     * @property {String} baseUrl
     * @property {String} certificateAuthority
     * @property {String} pathStyle
     * @property {String} region
     * @property {String} secretKey
     */

    var s3Configuration = configuration.s3;
    var pathConfiguration = configuration.path;

    // Normalise configuration.

    typeof s3Configuration === DataType.STRING && (s3Configuration = [s3Configuration]);
    Array.isArray(s3Configuration) && (s3Configuration = {'': s3Configuration});

    deployTasks.push(Task.DEPLOY_S3);
    gulp.task(Task.DEPLOY_S3, function () {
        var streams = [];

        Object.keys(s3Configuration).forEach(function (bucket) {

            /** @type {S3Target} */
            var bucketConfiguration = s3Configuration[bucket];
            var source;
            var plugins;

            var accessKey;
            var baseUrl;
            var certificateAuthority;
            var pathStyle;
            var region;
            var secretKey;
            var index;

            if (typeof bucketConfiguration === DataType.STRING || Array.isArray(bucketConfiguration)) {
                source = bucketConfiguration;
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

            var awsConfiguration = {
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

            (plugins == null || plugins.length === 0) && (plugins = [Plugin.DEFAULT]);
            (index = plugins.indexOf(Plugin.DEFAULT)) >= 0 && plugins.splice(index, 1, Plugin.NORMALISE);
            (index = plugins.indexOf(Plugin.NORMALISE)) >= 0 && plugins.splice(index, 1);

            // Normalise sources, they may contain all sort of shit as we about to find out.

            var sources = Array.isArray(source) ? source : [sources];

            sources.forEach(function (source) {
                var base = path.join(configuration.path.product, 'html');
                var pipeline = gulp.src(source, {base: base}).pipe(plumber());

                pipeline = pipeline
                    .pipe(rename(function (path) { path.dirname = '/' + path.dirname }))
                    .pipe(awspublish.create(awsConfiguration).publish(null, {force: true}))
                    .pipe(awspublish.reporter({}));

                streams.push(pipeline);
            });
        });

        return merge(streams);
    });
}

/**
 * @param {Gulp} gulp
 * @param {GuildConfiguration} configuration
 * @param {Object} parameters
 */
function deploy(gulp, configuration, parameters) {
    var deployConfiguration = configuration.deploy;
    var pathConfiguration = configuration.path;
    var clean = deployConfiguration.clean != null;
    var deploy = deployConfiguration.deploy != null;
    var validator = new SchemaValidator();

    // Inject stuff into deploy configuration.

    deployConfiguration.path = pathConfiguration;

    // Gulp help stuff.

    var description = 'Clean and build dependencies into local libraries.';
    var options = {
        production: 'Build for production, will minify and strip everything it can. Very slow.',
        watch: 'Watch files for changes to re-run.'
    };
    var taskOptions = {
        clean: 'Clean dependencies.',
        deploy: 'Normalise dependencies.'
    };

    var cleanTasks = [];
    var dependencyTasks = [];
    var generators = {
        s3: createDeployS3Task
    };

    Object.keys(deployConfiguration).forEach(function (key) {
        var generator = generators[key];
        var schema = Schema['DEPLOY_' + key.toUpperCase()];
        if (generator != null && schema != null && validator.validate(deployConfiguration[key], schema, {throwError: true})) {
            generator(gulp, deployConfiguration, parameters, cleanTasks, dependencyTasks);
            options[key] = taskOptions[key];
        }
    });

    gulp.task(Task.DEPLOY, description, function (callback) {
        var tasks = [];

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

module.exports = deploy;