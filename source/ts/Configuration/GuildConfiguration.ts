import {BuildConfiguration} from '../Task/BuildFactory';
import {ConfigurationInterface} from './Configuration';
import {DependencyConfiguration} from '../Task/DependencyFactory';
import {DeployConfiguration} from '../Task/DeployFactory';

// Guild configuration.

export interface GuildConfiguration extends ConfigurationInterface {
    build?: BuildConfiguration;
    dependency?: DependencyConfiguration;
    deploy?: DeployConfiguration;
}