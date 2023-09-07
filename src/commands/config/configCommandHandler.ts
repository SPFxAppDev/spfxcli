import { extend, isset } from '@spfxappdev/utility';
import { CLI_Config } from '../../index';
import { allowedValues, pathForKey, supportedPackageManager } from './constants';
import chalk from 'chalk';
import * as Table from 'cli-table3';
import * as fs from 'fs';
import * as path from 'path';
import detectIndent from 'detect-indent';
import { SPCredentialManager } from '../../sharepoint/SPCredentialManager';

export class ConfigCommandHandler {
  private readonly localConfigFileName: string = 'spfxappdev-cli.config.json';

  constructor(private readonly argv) {}

  private get useLocalConfig(): boolean {
    return this.argv.local || false;
  }

  public execute(
    commandType: 'all' | 'set' | 'get' | 'add' | 'remove' | 'removeAll' | 'create'
  ): void {
    if (commandType === 'all') {
      return this.showConfig();
    }

    if (commandType === 'set') {
      return this.setConfig();
    }

    if (commandType === 'get') {
      return this.getConfig();
    }

    if (commandType === 'add') {
      return this.addValuesToConfig();
    }

    if (commandType === 'remove') {
      return this.removeValuesFromConfig();
    }

    if (commandType === 'removeAll') {
      return this.removeAllValuesFromConfig();
    }

    if (commandType === 'create') {
      return this.createLocalConfigFile();
    }

    console.error('NO COMMAND SET');
  }

  private showConfig(): void {
    const leftMargin = '    ';
    const table = new Table.default({
      head: ['key', 'value'],
      // colWidths: [100, 50, 300],
      chars: {
        left: leftMargin.concat('│'),
        'top-left': leftMargin.concat('┌'),
        'bottom-left': leftMargin.concat('└'),
        mid: '',
        'left-mid': '',
        'mid-mid': '',
        'right-mid': '',
      },
    });

    for (const key of allowedValues) {
      const value = CLI_Config.tryGetValue(pathForKey[key], this.useLocalConfig);
      table.push([chalk.green(key), chalk.cyan(value)]);
    }

    console.log(table.toString());
  }

  private getConfig(): void {
    console.log(CLI_Config.tryGetValue(this.argv.key, this.useLocalConfig));
  }

  private setConfig(): void {
    if (
      this.argv.key === 'packageManager' &&
      !supportedPackageManager.Contains((p) => p.Equals(this.argv.value))
    ) {
      return console.error(
        chalk.red(
          `The passed value is not valid. Supported package manager are: ${supportedPackageManager.join(
            ', '
          )}`
        )
      );
    }

    let value = this.argv.value;
    if (this.argv.key === 'password') {
      const spCredManager: SPCredentialManager = new SPCredentialManager(this.argv);
      value = spCredManager.createEncryptedPassword(value, this.argv.local || false);
    }

    CLI_Config.setConfig(pathForKey[this.argv.key], value, this.useLocalConfig);
  }

  private addValuesToConfig(): void {
    const key = pathForKey[this.argv.key];

    let currentValues: string[] = CLI_Config.tryGetValue(key, this.useLocalConfig);

    if (!isset(currentValues)) {
      currentValues = [];
    }

    const values: string[] = this.argv.values;

    let newValues = values.Where((v) => !currentValues.Contains((c) => c.Equals(v)));

    newValues = [...currentValues, ...newValues];

    CLI_Config.setConfig(key, newValues, this.useLocalConfig);
  }

  private removeValuesFromConfig(): void {
    const key = pathForKey[this.argv.key];

    let currentValues: string[] = CLI_Config.tryGetValue(key, this.useLocalConfig);

    if (!isset(currentValues)) {
      currentValues = [];
    }

    const values: string[] = this.argv.values;

    let newValues = currentValues.Where((v) => !values.Contains((c) => c.Equals(v)));

    CLI_Config.setConfig(key, newValues, this.useLocalConfig);
  }

  private removeAllValuesFromConfig(): void {
    const key = pathForKey[this.argv.key];
    CLI_Config.setConfig(key, [], this.useLocalConfig);
  }

  private createLocalConfigFile(): void {
    CLI_Config.createLocalConfigFile();
  }
}
