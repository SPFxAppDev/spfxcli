import * as Configstore from 'configstore';
import * as fs from 'fs';
import { defaultConfig } from './defaultConfig';

const packageJson = JSON.parse(fs.readFileSync('../../package.json', 'utf8'));

export class CLIConfig {
  private configName: string;

  private config: Configstore.default;

  constructor() {
    this.configName = packageJson.name;
    this.config = new Configstore.default(this.configName, {
      ...defaultConfig,
    });
  }
}
