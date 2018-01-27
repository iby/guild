import {AbstractFactory, Task} from './AbstractFactory';
import {ConfigurationInterface, PluginGenerator} from '../../Configuration/Configuration';
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
import awspublish = require('gulp-awspublish');
import merge = require('merge-stream');
import path = require('path');
import rename = require('gulp-rename');
import url = require('url');

import pathJoin = path.join;

export type Configuration = [S3Configuration, PathConfiguration];
export type Configurations = [S3Configuration[], PathConfiguration];

export interface Target {
    path: string;
    base?: string;

    /**
     * Target specific prefix, if prefix option is specified in configuration, target prefix will be appended
     * after it, otherwise only target prefix will be used.
     */
    prefix?: string;
}

export interface S3Configuration extends ConfigurationInterface {
    accessKey?: string;
    baseUrl?: string;
    bucket?: string;
    certificateAuthority?: string;
    configuration?: {
        accessKeyId: string;
        secretAccessKey: string;
        params: {
            Bucket: string;
        }
    }
    pathStyle?: string;
    plugins?: PluginGenerator,

    /**
     * Global prefix for all targets, also configurable via parameters, useful when all targets must be deployed
     * to a specific location within the bucket.
     */
    prefix?: string,
    region?: string;
    secretKey?: string;
    target: Target[];
}

export class S3Factory extends AbstractFactory {

    /**
     * @inheritDoc
     */
    protected option: Option = new Option('normalise', 'Normalise dependencies.');

    /**
     * Soft-checks whether the object is a `Target` interface.
     */
    protected static isTarget(object: any) {
        return object.path != null;
    }

    /**
     * Soft-checks whether the object is a `S3Configuration` interface.
     */
    protected static isConfiguration(object: any) {
        return object.target != null;
    }

    /**
     * @inheritDoc
     */
    public normaliseConfigurations(configuration: Configuration, parameters: ParsedArgs): Configurations {
        let [s3Configuration, pathConfiguration]: Configuration = configuration;
        let s3Configurations: S3Configuration[] = [];
        let self: S3Factory = this;

        let array: boolean = Array.isArray(s3Configuration);
        let object: boolean = typeof s3Configuration === DataType.OBJECT;

        if (!object && !array) {
            throw new NormaliseConfigurationError('Expecting either an object or array, received something totally different.');
        } else if (array) {
            s3Configurations = <any>s3Configuration;
        } else {
            s3Configurations = [s3Configuration];
        }

        s3Configurations = s3Configurations.map(function (configuration: S3Configuration): S3Configuration {

            // If configuration is already an object, we inject target into it if necessary. If not, we turn it
            // into object. In both cases some normalisation takes place.

            if (typeof configuration !== DataType.OBJECT) {
                configuration = {target: [{path: <any>configuration}]};
            } else if (S3Factory.isTarget(configuration)) {
                configuration = {target: [<any>configuration]};
            } else if (!S3Factory.isConfiguration(configuration)) {
                throw new NormaliseConfigurationError('Unexpected object format.');
            }

            // Quick target validate.

            if (configuration.target == null) {
                throw new NormaliseConfigurationError('Target is missing.');
            }

            return self.normaliseConfiguration(configuration, parameters);
        });

        return [s3Configurations, pathConfiguration];
    }

    /**
     * @inheritDoc
     */
    public normaliseConfiguration(configuration: S3Configuration, parameters?: ParsedArgs): S3Configuration {
        let accessKey: string = configuration.accessKey;
        let baseUrl: string = configuration.baseUrl;
        let bucket: string = configuration.bucket;
        let certificateAuthority: string = configuration.certificateAuthority;
        let pathStyle: string = configuration.pathStyle;
        let plugins: PluginGenerator = configuration.plugins;
        let prefix: string = configuration.prefix;
        let region: string = configuration.region;
        let secretKey: string = configuration.secretKey;
        let target: any = configuration.target;

        // If required configuration didn't come with the bucket try getting it from parameters.

        baseUrl == null && (baseUrl = parameters[Parameter.BASE_URL]);
        bucket == null && (bucket = parameters[Parameter.BUCKET]);
        certificateAuthority == null && (certificateAuthority = parameters[Parameter.CERTIFICATE_AUTHORITY]);
        pathStyle == null && (pathStyle = parameters[Parameter.PATH_STYLE]);
        region == null && (region = parameters[Parameter.REGION]);

        // Check if bucket "alias" is specified in cli parameters, same for access and secret keys.

        if (bucket != null) {
            accessKey == null && (accessKey = parameters[bucket + '-' + Parameter.ACCESS_KEY]);
            secretKey == null && (secretKey = parameters[bucket + '-' + Parameter.SECRET_KEY]);
            prefix == null && (prefix = parameters[bucket + '-' + Parameter.PREFIX]);
            parameters[bucket + '-' + Parameter.BUCKET] == null || (bucket = parameters[bucket + '-' + Parameter.BUCKET]);
        }

        // If both access and secret keys and prefix are still missing, but bucket is set, use default ones.

        if (bucket != null) {
            accessKey == null && (accessKey = parameters[Parameter.ACCESS_KEY]);
            secretKey == null && (secretKey = parameters[Parameter.SECRET_KEY]);
            prefix == null && (prefix = parameters[Parameter.PREFIX]);
        }

        // Normalise targets, it either is an array of targets or a single object.

        let targets: Target[] = Array.isArray(target) ? target : [target];

        targets = targets.map(function (target: any) {
            if (typeof target === DataType.STRING) {
                return {path: target, prefix: prefix};
            } else if (typeof target === DataType.OBJECT && S3Factory.isTarget(target)) {
                prefix == null || (target.prefix = target.prefix == null ? null : pathJoin(prefix, target.prefix));
                return target;
            } else {
                throw new NormaliseConfigurationError('Target is in a wrong format.');
            }
        });

        // Create configuration that will be passed to aws publish module, it uses different parameter names
        // and structure that would be more difficult to configure, so we do this manual proxying…

        let awsConfiguration: any = {
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

        // And…

        plugins == null && (plugins = null);

        configuration = <S3Configuration>{
            target: targets,
            configuration: awsConfiguration,
            plugins: plugins
        };

        return configuration;
    }

    /**
     * @inheritDoc
     */
    public constructTask(gulp: GulpHelp, configuration: Configurations): string[] {
        let self: S3Factory = this;

        gulp.task(TaskName.DEPLOY_S3, false, function () {
            let [s3Configurations, pathConfiguration]: Configurations = configuration;
            let streams: ReadWriteStream[] = [];
            let configurationCount: number = s3Configurations.length;

            for (let s3Configuration of s3Configurations) {
                let targets: Target[] = s3Configuration.target;
                let error: Error = null;

                let bucket: string = s3Configuration.configuration.params.Bucket;
                let accessKey: string = s3Configuration.configuration.accessKeyId;
                let secretKey: string = s3Configuration.configuration.secretAccessKey;

                if (bucket == null || bucket == '') {
                    error = new Error('Bucket is missing.');
                } else if (accessKey == null || secretKey == null) {
                    error = new Error('Access or secret keys are missing.');
                }

                // We only want to throw error at this point if dealing with a single configuration, if we have
                // multiple configurations, it's likely that we simply don't want to upload into this bucket.

                if (error != null && configurationCount > 1) {
                    continue;
                } else if (error != null) {
                    throw error;
                }

                for (let target of targets) {
                    let stream: ReadWriteStream;

                    stream = gulp.src(target.path, target.base == null ? {} : {base: target.base}).pipe(self.constructPlumber());
                    stream = self.constructStream(stream, [s3Configuration, target]);

                    streams.push(stream);
                }
            }

            if (streams.length == 0) {
                throw new Error('Could not configure any S3 tasks, check that credentials and targets for at least one bucket are specified correctly.');
            }

            return streams.length > 1 ? merge(...streams) : streams.pop();
        });

        return [TaskName.DEPLOY_S3];
    }

    /**
     * @inheritDoc
     */
    public constructPipeline(configuration: [S3Configuration, Target]): Pipeline {
        let [s3configuration, target]: [S3Configuration, Target] = configuration;
        let plugins: any[] = this.constructPlugins(s3configuration.plugins);
        let index: number;

        (plugins == null || (<any[]>plugins).length === 0) && (plugins = [Plugin.DEFAULT]);
        (index = (<any[]>plugins).indexOf(Plugin.DEFAULT)) >= 0 && (<any[]>plugins).splice(index, 1, Plugin.S3);

        if ((index = (<any[]>plugins).indexOf(Plugin.S3)) >= 0) {
            (<any[]>plugins).splice(index, 1);

            // Add prefix if it's specified, make sure index gets increased.
            target.prefix == null || (<any[]>plugins).splice(index++, 0, rename(function (path) {
                path.dirname = pathJoin(target.prefix, path.dirname);
            }));

            (<any[]>plugins).splice(index, 0,
                // Send files to S3.
                awspublish.create(s3configuration.configuration).publish(null, {force: true}),

                // Report back statistics.
                awspublish.reporter({})
            );
        }

        return this.pipelineStreams(plugins);
    }

    /**
     * @inheritDoc
     */
    public construct(): Task {
        let configurations: Configurations = this.normaliseConfigurations(this.configuration, this.parameters);
        let gulp: GulpHelp = this.gulp;

        return this.constructTask(gulp, configurations)
    }
}