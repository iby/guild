import {PathConfiguration} from '../../source/ts/Configuration/PathConfiguration';
import path = require('path');

export var configuration:PathConfiguration = new PathConfiguration(path.join(__dirname, '../project'));