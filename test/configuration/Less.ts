export var configuration:any = {
    dependency: {
        clean: true,
        normalise: {
            "flexboxgrid": 'bower_components/flexboxgrid/dist/flexboxgrid.min.css',
            "jquery": 'bower_components/jquery/dist/jquery.min.js',
            "normalize": 'bower_components/normalize.css/normalize.css'
        }
    },
    build: {
        webpack: webpackConfiguration,
        less: {
            // source: 'less/Style.less', fixme: watch **/* appending bullshit…
            destination: ['css', path.join(pathConfiguration.entrypoint, 'css')]
        },
        twig: {
            clean: false,
            data: twigData,
            source: ['twig', '!twig/layout.twig'], // fixme…
            destination: ['html', pathConfiguration.entrypoint]
        }
    },
    deploy: {
        s3: [
            {path: path.join(pathConfiguration.library, 'img/**/*'), base: pathConfiguration.library},
            {path: path.join(pathConfiguration.library, 'img/favicon.ico'), base: path.join(pathConfiguration.library, 'img')},
            {path: path.join(pathConfiguration.product, 'css/**/*'), base: pathConfiguration.product},
            {path: path.join(pathConfiguration.product, 'html/**/*'), base: path.join(pathConfiguration.product, 'html')},
            {path: path.join(pathConfiguration.product, 'js/**/*'), base: pathConfiguration.product}
        ]
    },
    path: pathConfiguration
};