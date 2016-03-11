import {PathConfiguration} from './PathConfiguration';

// Function that generates a plugin.
export declare type PluginGenerator = () => any[]

// Base interfaces.

export interface ConfigurationInterface { [key:string]:any }
export interface CleanConfigurationInterface extends ConfigurationInterface { clean?:boolean }
export interface DestinationConfigurationInterface extends ConfigurationInterface { destination?:string|string[] }
export interface PathConfigurationInterface extends ConfigurationInterface { path?:PathConfiguration }
export interface PluginsConfigurationInterface extends ConfigurationInterface { plugins?:any[]|PluginGenerator }
export interface SourceConfigurationInterface extends ConfigurationInterface { source?:string|string[] }
export interface WatchConfigurationInterface extends ConfigurationInterface { watch?:boolean }

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

export interface LessConfiguration extends CleanConfigurationInterface, DestinationConfigurationInterface, PathConfigurationInterface, PluginsConfigurationInterface, SourceConfigurationInterface, WatchConfigurationInterface {
}

export interface TwigConfiguration extends CleanConfigurationInterface, DestinationConfigurationInterface, PathConfigurationInterface, PluginsConfigurationInterface, SourceConfigurationInterface, WatchConfigurationInterface {
    data?:any;
}

export interface WebpackConfiguration extends CleanConfigurationInterface, DestinationConfigurationInterface, PathConfigurationInterface, PluginsConfigurationInterface, SourceConfigurationInterface, WatchConfigurationInterface {
    configuration?:any;
}

// Dependency configurations.

export interface DependencyConfiguration extends CleanConfigurationInterface, PathConfigurationInterface {
    normalise?:NormaliseConfiguration;
}

export interface NormaliseConfiguration extends DestinationConfigurationInterface, PluginsConfigurationInterface, SourceConfigurationInterface {
}

// Deploy configurations.

export interface DeployConfiguration extends PathConfigurationInterface {
    s3?:S3Configuration;
}

export interface S3Configuration extends PluginsConfigurationInterface {
    accessKey?:string;
    baseUrl?:string;
    certificateAuthority?:string;
    pathStyle?:string;
    region?:string;
    secretKey?:string;
    target?:string|string[]
}