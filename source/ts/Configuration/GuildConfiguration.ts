import {PathConfiguration} from './PathConfiguration';

export declare type PluginGenerator = () => any[]


// Base interfaces.

export interface Configuration { [key: string]: any }
export interface DestinationConfiguration extends Configuration { destination?:string }
export interface PathConfigurationInterface extends Configuration { path?:PathConfiguration }
export interface SourceConfiguration extends Configuration { source?:string }
export interface PluginsConfiguration extends Configuration { plugins?:any[]|PluginGenerator }


// Guild configuration.

export interface GuildConfiguration extends PathConfigurationInterface {
    build?:BuildConfiguration;
    dependency?:DependencyConfiguration;
    deploy?:DeployConfiguration;
}


// Build configurations.

export interface BuildConfiguration extends PathConfigurationInterface {
    less?:LessConfiguration;
    twig?:TwigConfiguration;
    webpack?:WebpackConfiguration;
}

export interface LessConfiguration extends DestinationConfiguration, PathConfigurationInterface, PluginsConfiguration, SourceConfiguration {
}

export interface TwigConfiguration extends DestinationConfiguration, PathConfigurationInterface, PluginsConfiguration, SourceConfiguration {
    data?:any;
}

export interface WebpackConfiguration extends DestinationConfiguration, PathConfigurationInterface, PluginsConfiguration, SourceConfiguration {
    configuration?:any;
}


// Dependency configurations.

export interface DependencyConfiguration extends PathConfigurationInterface {
    clean?:any;
    normalise?:NormaliseConfiguration;
}

export interface NormaliseConfiguration extends DestinationConfiguration, PluginsConfiguration, SourceConfiguration {
}


// Deploy configurations.

export interface DeployConfiguration extends PathConfigurationInterface {
    s3?:S3Configuration;
}

export interface S3Configuration extends PluginsConfiguration, SourceConfiguration {
    accessKey?:string;
    baseUrl?:string;
    certificateAuthority?:string;
    pathStyle?:string;
    region?:string;
    secretKey?:string;
}