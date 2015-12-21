# Guild

Guild is a gulp configuration (tool more than a) framework for common build-test-deploy tasks to avoid reinventing the wheel with every project. Instead of copy pasting same unmaintainable tasks from project to project, with guild, they can be plugged as an npm module and used with a simple configuration.

- [Dependency](#dependency)
    - [Normalise](#normalise)
- [Build](#build)
    - [Less](#less)
    - [Webpack](#webpack)
- [Deployment](#deployment)
    - [S3](#s3)

## Usage

```js
var configuration = require('./configuration/Path');
var guild = require('@ianbytchek/guild');
var gulp = require('gulp');

guild(gulp, {
    dependency: {
        normalise: {
            "foo": "/absolute/foo.js",
            "bar": {path: "relative/bar.css", plugins: function(){ return [myStream()] }}
        }
    },
    build: {,
        webpack: {
            configuration: require('./configuration/Webpack')
        },
        less: true,
        twig: true
    },
    deployment: {
        s3: [
            'js',
            'css',
            'html'
        ]
    }
    path: configuration
});
```

The above goes into the `guilpfile.js`. It will add the specified tasks and can be safely used with your own tasks, given there are no naming conflicts.

- `dependency` – builds dependencies (typically) into local libraries that are standardised, minified and stripped of comments.
- `build` – builds sources into products that are ready for testing and deployment.
- `test` – tests the built products.
- `deployment` – deploys the built (and tested) products.

You can use the global `-w` or `--watch` flag to run guild in the background. Task-specific options are described in configuration.

## Setup

Install using `npm install @ianbytchek/guild` or add it to `package.json`.

```json
"dependencies": {
    "guild": "@ianbytchek/guild"
}
```

## Configuration

### Path

`Path` object holds default project paths if configuration contains relative paths or assumes the use of default locations. It can be created with `require('@ianbytchek/guild').Path('/absolute/root/path'))`.

### Dependency

Prepares project dependencies, which most often require little touches to go into the code.

#### Normalise

Normalises dependencies, typical use case is to minify them, strip comments, and move to a single location, like `library/js` or `library/css` folder.

```js
normalise: {
    "foo": path.join(configuration.path.dependency, 'bower/foo.js')
    "bar": {
        source: path.join(configuration.path.dependency, 'bower/bar/bar.css'),
        destination: path.join(configuration.path.library, 'css/bar.css'),
        pipeline: ['default', 'minify', 'uncomment', require('gulp-autoprefixer')]
    }
}
```

Normalise will automatically determine if the dependency is `js` or `css` and will send it through default streams, so you can simply tell it the where the source is, the key will be used to name the final file.

- `source` – path, array of paths, required.
- `destination` – path, array of paths, optional, outputs everything into `configuration.path.library`, will raise exception if not specified and multiple sources are used or when library path is not defined.
- `plugins` – array of custom streams (when constants) or a function returning an array of actual streams. You can provide standard guild pipelines as strings, `default` includes them all.

### Build

Builds project files, typically involves building js, css, html products and packaging them up with webpack.

#### Less

Compiles less sources, simplified form allows specifying only `true` or less source path.

```js
less: true,
less: 'less/source/path'
less: {
    source: path.join(configuration.source, 'less'),
    destination: path.join(configuration.product, 'css')
}
```

Full form assumes a single configuration object or an array of them.

- `source` - path, array of paths.
- `destination` - path, array of paths.
- `plugins` – same as for normalise task.

#### Webpack

Compiles webpack sources.

```js
webpack: {
    source: path.join(configuration.source, 'less'),
    destination: path.join(configuration.product, 'css'),
    configuration: require('…')
}
```

- `source` - path.
- `destination` - path.
- `configuration` – standard webpack configuration.
- `plugins` – same as for normalise task.

### Deployment

#### S3

```js
s3: [
    'js',
    'css'
],
s3: {
    "fooBucket": path.join(configuration.product, 'js/**/*'),
    "barBucket": {
        target: path.join(configuration.product, 'css/**/*'),
        accessKey: '…',
        secretKey: '…',
        region: '…',
    }
}
```

## Similar projects

There are a few similar projects, I haven't seen a single compiled a list anywhere, so if you know something cool and fast-growing or already grown, I'd appreciate you adding it below.

- https://github.com/vigetlabs/gulp-starter
