export class Task {
    static BUILD:string = 'build';
    static BUILD_LESS:string = 'build-less';
    static BUILD_LESS_CLEAN:string = 'build-less-clean';
    static BUILD_LESS_WATCH:string = 'build-less-watch';
    static BUILD_TWIG:string = 'build-twig';
    static BUILD_TWIG_CLEAN:string = 'build-twig-clean';
    static BUILD_TWIG_WATCH:string = 'build-twig-watch';
    static BUILD_WEBPACK:string = 'build-webpack';
    static BUILD_WEBPACK_CLEAN:string = 'build-webpack-clean';
    static BUILD_WEBPACK_WATCH:string = 'build-webpack-watch';

    static DEPENDENCY:string = 'dependency';
    static DEPENDENCY_CLEAN:string = 'dependency-clean';
    static DEPENDENCY_NORMALISE:string = 'dependency-normalise';

    static DEPLOY:string = 'deploy';
    static DEPLOY_S3:string = 'deploy-s3';
}