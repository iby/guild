declare module 'del' {
    function del(pattern:any, options:any):any;
    export = del;
}

declare module 'gulp-awspublish' {
    import {Writable} from 'stream';

    export interface Publisher {
        publish(headers:any, options:any):Writable;
    }

    export function reporter(param:any):Writable;
    export function create(options:any):Publisher;
}

declare module 'gulp-postcss' {
    function postcss(options:any):any;
    export = postcss;
}

declare module 'gulp-twig' {
    function twig(options:any):any;
    export = twig;
}

declare module 'jsonschema' {
    export class Validator {
        addSchema(json:any, uri?:string):any;
        validate(instance:any, schema:any, options?:any, context?:any):any[];
    }
}

declare module 'webpack-stream' {
    import {Webpack} from "webpack";
    function webpack(options:any, webpack?:Webpack):any;
    export = webpack;
}