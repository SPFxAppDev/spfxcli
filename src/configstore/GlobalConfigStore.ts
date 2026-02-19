import Configstore from 'configstore';
import * as fs from 'fs';
import { defaultConfig } from './defaultConfig.js';
import * as path from 'path';
import spfxAppDevUtility from '@spfxappdev/utility';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { getDeepOrDefault, isNullOrEmpty, issetDeep } = spfxAppDevUtility;

const packagePath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

export class GlobalConfigStore {
  private configName: string;

  private config: Configstore;

  private static currentInstance: GlobalConfigStore = null;

  private constructor() {
    this.configName = packageJson.name;
    this.config = new Configstore(this.configName, {
      ...defaultConfig,
    });
  }

  public static Current(): GlobalConfigStore {
    if (isNullOrEmpty(GlobalConfigStore.currentInstance)) {
      GlobalConfigStore.currentInstance = new GlobalConfigStore();
    }

    return GlobalConfigStore.currentInstance;
  }

  public tryGetValue(path: string): any {
    const allProperties = this.config.all;

    const defaultValue = getDeepOrDefault(defaultConfig, path);
    return getDeepOrDefault(allProperties, path, defaultValue);
  }

  public getAll(): any {
    return { ...this.config.all };
  }

  public setConfig(key: string, value: any): any {
    if (!issetDeep(defaultConfig, key)) {
      return console.log('This is a not supported key');
    }

    this.config.set(key, value);
  }
}
