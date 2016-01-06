import {Path} from './Path';

export declare type PluginGenerator = () => any[]

// Base interfaces.

export interface Configuration { [key: string]: any }
export interface DestinationConfiguration extends Configuration { destination?:string }
export interface PathConfiguration extends Configuration { path?:Path }
export interface SourceConfiguration extends Configuration { source?:string }
export interface PluginsConfiguration extends Configuration { plugins?:any[]|PluginGenerator }


// Guild configuration.

export interface Guild extends PathConfiguration {
    build?:Build;
    dependency?:Dependency;
    deploy?:Deploy;
}


// Build configurations.

export interface Build extends PathConfiguration {
    less?:Less;
    twig?:Twig;
    webpack?:Webpack;
}

export interface Less extends DestinationConfiguration, PathConfiguration, PluginsConfiguration, SourceConfiguration {
}

export interface Twig extends DestinationConfiguration, PathConfiguration, PluginsConfiguration, SourceConfiguration {
    data?:any;
}

export interface Webpack extends DestinationConfiguration, PathConfiguration, PluginsConfiguration, SourceConfiguration {
    configuration?:any;
}


// Dependency configurations.

export interface Dependency extends PathConfiguration {
    clean?:any;
    normalise?:NormaliseTarget;
}

export interface NormaliseTarget extends DestinationConfiguration, PluginsConfiguration, SourceConfiguration {
}


// Deploy configurations.

export interface Deploy extends PathConfiguration {
    s3?:S3Target;
    path?:Path;
}

export interface S3Target extends PluginsConfiguration, SourceConfiguration {
    accessKey?:string;
    baseUrl?:string;
    certificateAuthority?:string;
    pathStyle?:string;
    region?:string;
    secretKey?:string;
}