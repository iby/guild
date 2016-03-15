import {AbstractFactory, Task} from './AbstractFactory';
import {ConfigurationInterface} from '../../Configuration/Configuration';
import {DataType} from '../../Constant/DataType';
import {GulpHelp} from 'gulp-help';
import {NormaliseConfigurationError} from '../AbstractFactory';
import {Option} from '../Option';
import {Parameter} from '../../Constant/Parameter';
import {ParsedArgs} from 'minimist';
import {PathConfiguration} from '../../Configuration/PathConfiguration';
import {Pipeline, ReadWriteStream} from '../../Stream/Pipeline';
import {Plugin} from '../../Constant/Plugin';
import {Task as TaskName} from '../../Constant/Task';
import {PathUtility} from '../../Utility/PathUtility';

import awspublish = require('gulp-awspublish');
import merge = require('merge-stream');
import path = require('path');
import rename = require('gulp-rename');
import sequence = require('run-sequence');
import url = require('url');
import clone = require("clone");

export type Configuration = [S3Configuration, PathConfiguration];
export type Configurations = [S3Configuration[], PathConfiguration];

export interface Path {
    path:string;
    base?:string;
}

export interface S3Configuration extends ConfigurationInterface {
    accessKey?:string;
    baseUrl?:string;
    bucket?:string;
    certificateAuthority?:string;
    configuration?:{
        accessKeyId:string;
        secretAccessKey:string;
        params:{
            Bucket:string;
        }
    }
    pathStyle?:string;
    plugins?:any,
    region?:string;
    secretKey?:string;
    target:Path;
}

export class S3Factory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    protected option:Option = new Option('normalise', 'Normalise dependencies.');

    /**
     * Soft-checks whether the object is a `Path` interface.
     */
    protected static isPath(object:any) {
        return object.path != null;
    }

    /**
     * Soft-checks whether the object is a `S3Configuration` interface.
     */
    protected static isConfiguration(object:any) {
        return object.target != null;
    }

    /**
     * @inheritDoc
     */
    public normaliseConfigurations(configuration:Configuration, parameters:ParsedArgs):Configurations {
        var [s3Configuration, pathConfiguration]:Configuration = configuration;
        var s3Configurations:S3Configuration[] = [];
        var self:S3Factory = this;

        var array:boolean = Array.isArray(s3Configuration);
        var object:boolean = typeof s3Configuration === DataType.OBJECT;

        if (!object && !array) {
            throw new NormaliseConfigurationError('Expecting either an object or array, received something totally different.');
        } else if (array) {
            s3Configurations = <any>s3Configuration;
        } else {
            s3Configurations = [s3Configuration];
        }

        s3Configurations = s3Configurations.map(function (configuration:S3Configuration) {
            var target:Path;

            // If configuration is already an object, we inject target into it if necessary. If not,
            // we turn it into object. In both cases some normalisation takes place.

            if (typeof configuration !== DataType.OBJECT) {
                configuration = {target: target = {path: <any>configuration}};
            } else if (S3Factory.isPath(configuration)) {
                configuration = {target: target = <any>configuration};
            } else if (S3Factory.isConfiguration(configuration)) {
                target = configuration.target;
            } else {
                throw new NormaliseConfigurationError('Unexpected object format.');
            }

            // Quick target validate.

            if (target == null) {
                throw new NormaliseConfigurationError('Target is missing.');
            }

            return self.normaliseConfiguration([configuration, pathConfiguration], parameters);
        });

        return [s3Configurations, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration:Configuration, parameters?:ParsedArgs):S3Configuration {
        var [s3Configuration, pathConfiguration]:Configuration = configuration;

        var accessKey:string = s3Configuration.accessKey;
        var baseUrl:string = s3Configuration.baseUrl;
        var bucket:string = s3Configuration.bucket;
        var certificateAuthority:string = s3Configuration.certificateAuthority;
        var pathStyle:string = s3Configuration.pathStyle;
        var plugins:any[] = s3Configuration.plugins;
        var region:string = s3Configuration.region;
        var secretKey:string = s3Configuration.secretKey;
        var target:any = s3Configuration.target;

        // If configuration didn't come with the bucket try getting it from parameters.

        accessKey == null && (accessKey = parameters[Parameter.ACCESS_KEY]);
        baseUrl == null && (baseUrl = parameters[Parameter.BASE_URL]);
        bucket == null && (bucket = parameters[Parameter.BUCKET]);
        certificateAuthority == null && (certificateAuthority = parameters[Parameter.CERTIFICATE_AUTHORITY]);
        pathStyle == null && (pathStyle = parameters[Parameter.PATH_STYLE]);
        region == null && (region = parameters[Parameter.REGION]);
        secretKey == null && (secretKey = parameters[Parameter.SECRET_KEY]);

        // Normalise targets, it either

        if (Array.isArray(target) || typeof target === DataType.STRING) {
            target = {path: target};
        } else if (typeof target !== DataType.OBJECT || !S3Factory.isPath(target)) {
            throw new NormaliseConfigurationError('Target is in a wrong format.');
        }

        // Check if the bucket "alias" is specified in cli parameters.

        if (bucket != null && parameters[bucket + '-' + Parameter.BUCKET] != null) {
            bucket = parameters[bucket + '-' + Parameter.BUCKET];
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

        return {
            target: target,
            configuration: awsConfiguration
        };
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp:GulpHelp, configuration:Configurations):string[] {
        var self:S3Factory = this;

        gulp.task(TaskName.DEPLOY_S3, false, function () {
            var [s3Configurations, pathConfiguration]:Configurations = configuration;
            var streams:ReadWriteStream[] = [];

            for (let s3Configuration of s3Configurations) {
                var stream:ReadWriteStream;
                var target:Path = s3Configuration.target;

                var bucket:string = s3Configuration.configuration.params.Bucket;
                var accessKey:string = s3Configuration.configuration.accessKeyId;
                var secretKey:string = s3Configuration.configuration.secretAccessKey;

                if (bucket == null || bucket == '') {
                    throw new Error('Bucket is missing.');
                } else if (accessKey == null || secretKey == null) {
                    throw new Error('Access or secret keys are missing.');
                }

                stream = gulp.src(target.path, target.base == null ? {} : {base: target.base}).pipe(self.constructPlumber());
                stream = self.constructStream(stream, s3Configuration);

                streams.push(stream);
            }
        });

        return [TaskName.DEPLOY_S3];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration:S3Configuration):Pipeline {
        var plugins:any = configuration.plugins instanceof Function ? configuration.plugins : function () { return clone(configuration.plugins) };
        var index:number;

        (plugins == null || (<any[]>plugins).length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = (<any[]>plugins).indexOf(Plugin.DEFAULT)) >= 0 && (<any[]>plugins).splice(index, 1, Plugin.S3);
        (index = (<any[]>plugins).indexOf(Plugin.S3)) >= 0 && (<any[]>plugins).splice(index, 1,

            // Not sure why, but I think there was a problem with that that got solved eventually, this is a todo.
            rename(function (path) { path.dirname = '/' + path.dirname }),

            // Send file to S3.
            awspublish.create(configuration.configuration).publish(null, {force: true}),

            // Report some statistics.
            awspublish.reporter({})
        );

        return this.pipelineStreams(plugins);
    }

    /**
     * @inheritDoc
     */
    public construct():Task {
        var configurations:Configurations = this.normaliseConfigurations(this.configuration, this.parameters);
        var gulp:GulpHelp = this.gulp;

        return this.constructTask(gulp, configurations)
    }
}