import * as fs from 'fs';
import * as path from 'path';
import detectIndent from 'detect-indent';
import { GlobalConfigStore } from './GlobalConfigStore.js';
import chalk from 'chalk';

import spfxAppDevUtility from '@spfxappdev/utility';
const { extend, getDeepOrDefault, isNullOrEmpty, issetDeep } = spfxAppDevUtility;

const localConfigFileName: string = 'spfxappdev-cli.config.json';
const localConfigPath = path.join(process.cwd(), localConfigFileName);

export class LocalConfigStore {
  private static currentInstance: LocalConfigStore = null;

  public localConfigExists: boolean = false;

  private config: any;

  private constructor() {
    this.localConfigExists = fs.existsSync(localConfigPath);
    this.loadConfig();
  }

  private get defaultConfig(): any {
    const globalConfig = GlobalConfigStore.Current().getAll();
    // globalConfig.sharepoint.password = '';
    return globalConfig;
  }

  public static Current(): LocalConfigStore {
    if (isNullOrEmpty(LocalConfigStore.currentInstance)) {
      LocalConfigStore.currentInstance = new LocalConfigStore();
    }

    return LocalConfigStore.currentInstance;
  }

  public tryGetValue(path: string): any {
    const allProperties = this.config;

    const defaultValue = getDeepOrDefault(this.defaultConfig, path);
    return getDeepOrDefault(allProperties, path, defaultValue);
  }

  public getAll(): any {
    return { ...this.config };
  }

  public setConfig(key: string, value: any): any {
    if (!issetDeep(this.defaultConfig, key)) {
      return console.log('This is a not supported key');
    }

    this.config = this.setByPath(this.config, key, value);
    this.saveConfig();
  }

  private setByPath(object, path, value): void {
    const keys = path.split('.');
    let temp = object;

    for (let i = 0; i < keys.length - 1; i++) {
      temp = temp[keys[i]];
    }

    temp[keys[keys.length - 1]] = value;

    return object;
  }

  private loadConfig(): void {
    const globalConfig: any = { ...this.defaultConfig };

    if (!this.localConfigExists) {
      this.config = globalConfig;
      return;
    }

    const localConfigString = fs.readFileSync(localConfigPath).toString();
    const localConfig = JSON.parse(localConfigString);

    const mergedConfig = extend({ ...globalConfig }, { ...localConfig });

    this.config = { ...mergedConfig };
  }

  private saveConfig(): any {
    let indent = '  ';

    if (this.localConfigExists) {
      const localConfigString = fs.readFileSync(localConfigPath).toString();
      indent = detectIndent(localConfigString).indent || indent;
    }

    fs.writeFileSync(localConfigPath, JSON.stringify(this.config, null, indent));
  }

  public createLocalConfigFile(): void {
    if (this.localConfigExists) {
      console.log(
        chalk.yellow(
          `A local file '${localConfigFileName}' already exist. It is merged with the configurations from the global file`,
        ),
      );
    }

    this.saveConfig();

    if (!this.localConfigExists) {
      console.log(chalk.green(`The file '${localConfigFileName}' was created successfully`));
    }
  }
}
