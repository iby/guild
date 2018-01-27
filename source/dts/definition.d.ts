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
    export interface Validation {
        instance: any;
        schema: Object;
        propertyPath: string;
        errors: any[]
    }

    export class Validator {
        addSchema(json:any, uri?:string):any;
        validate(instance:any, schema:any, options?:any, context?:any):Validation;
    }
}