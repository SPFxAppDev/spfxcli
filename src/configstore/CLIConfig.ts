import { defaultConfig } from './defaultConfig.js';
import { LocalConfigStore } from './LocalConfigStore.js';
import { GlobalConfigStore } from './GlobalConfigStore.js';
import spfxAppDevUtility from '@spfxappdev/utility';

const { getDeepOrDefault, isNullOrEmpty, issetDeep } = spfxAppDevUtility;

export class CLIConfig {
  private static currentInstance: CLIConfig = null;

  private readonly localStore: LocalConfigStore;

  private readonly globalStore: GlobalConfigStore;

  private constructor() {
    this.localStore = LocalConfigStore.Current();
    this.globalStore = GlobalConfigStore.Current();
  }

  public static Current(): CLIConfig {
    if (isNullOrEmpty(CLIConfig.currentInstance)) {
      CLIConfig.currentInstance = new CLIConfig();
    }

    return CLIConfig.currentInstance;
  }

  public tryGetValue(path: string, local: boolean = false): any {
    const allProperties = local ? this.localStore.getAll() : this.globalStore.getAll();
    const defaultValue = getDeepOrDefault(defaultConfig, path);
    return getDeepOrDefault(allProperties, path, defaultValue);
  }

  public getAll(local: boolean = false): any {
    const allProperties = local ? this.localStore.getAll() : this.globalStore.getAll();
    return { ...allProperties };
  }

  public setConfig(key: string, value: any, local: boolean = false): any {
    if (!issetDeep(defaultConfig, key)) {
      return console.log('This is a not supported key');
    }

    if (local) {
      this.localStore.setConfig(key, value);
      return;
    }

    this.globalStore.setConfig(key, value);
  }

  public createLocalConfigFile(): void {
    this.localStore.createLocalConfigFile();
  }
}
