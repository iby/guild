import fs = require('fs');
import path = require('path');
import SuperFile = require("vinyl");

var pathJoin = path.join;
var pathBasename = path.basename;

var basePath: string = pathJoin(__dirname, '../../../test');
var dependencyPath: string = pathJoin(basePath, 'project/dependency');
var sourcePath: string = pathJoin(basePath, 'project/source');

export abstract class AbstractFile extends SuperFile {
}

export class DependencyFile extends AbstractFile {
    public static css(path: string): SourceFile {
        return new DependencyFile({cwd: basePath, base: basePath, path: path = pathJoin(dependencyPath, path), contents: fs.readFileSync(path)});
    }

    public static js(path: string): SourceFile {
        return new DependencyFile({cwd: basePath, base: basePath, path: path = pathJoin(dependencyPath, path), contents: fs.readFileSync(path)});
    }
}

export class SourceFile extends AbstractFile {
    public static js(path: string): SourceFile {
        return new SourceFile({cwd: basePath, base: basePath, path: path = pathJoin(sourcePath, 'js', path), contents: fs.readFileSync(path)});
    }

    public static less(path: string): SourceFile {
        return new SourceFile({cwd: basePath, base: basePath, path: path = pathJoin(sourcePath, 'less', path), contents: fs.readFileSync(path)});
    }

    public static twig(path: string): SourceFile {
        return new SourceFile({cwd: basePath, base: basePath, path: path = pathJoin(sourcePath, 'twig', path), contents: fs.readFileSync(path)});
    }
}