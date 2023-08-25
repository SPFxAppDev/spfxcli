import chalk from 'chalk';
import { isNullOrEmpty, isset } from '@spfxappdev/utility';
import { CLI_Config } from '../../index';
import { execSync } from 'child_process';

export class NewCommandHandler {
  private options: string[] = [];

  private uniqueOptions: string[] = [];

  constructor(private readonly argv) {}

  public execute(): void {
    this.runYoMicrosoftSharePoint();
  }

  private runYoMicrosoftSharePoint(): void {
    this.createArrayForArgumentsToPass();
    this.setPackageManagerOption();

    let command = 'yo @microsoft/sharepoint ';
    try {
      command += this.options.join(' ');
      if (
        !isNullOrEmpty(this.options['pm']) &&
        (this.options['pm'] as string).Equals('pnpm')
      ) {
        execSync(`pnpm config set auto-install-peers true --location project`, {
          stdio: 'inherit',
        });

        execSync(`pnpm config set shamefully-hoist true --location project`, {
          stdio: 'inherit',
        });
      }

      execSync(`${command}`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error(chalk.red(`Error executing command ${command}: ${error}`));
    }
  }

  private createArrayForArgumentsToPass(): void {
    if (isNullOrEmpty(this.argv)) {
      return;
    }

    Object.getOwnPropertyNames(this.argv).forEach((propName: string) => {
      if (propName === '_' || propName === '$0') {
        return;
      }

      const uniqueName = propName.toLowerCase().ReplaceAll('-', '');
      if (isset(this.uniqueOptions[uniqueName])) {
        return;
      }

      this.uniqueOptions[uniqueName] = propName;

      if (typeof this.argv[propName] === 'boolean') {
        this.options.push(`--${propName}`);
      }

      if (typeof this.argv[propName] === 'string') {
        this.options.push(`--${propName} ${this.argv[propName]}`);
      }
    });
  }

  private setPackageManagerOption(): void {
    const supportedPackageManager: string[] = ['npm', 'pnpm', 'yarn'];
    let packageManager = this.argv.pm || this.argv.packageManager;

    if (
      isNullOrEmpty(packageManager) ||
      (!isNullOrEmpty(packageManager) &&
        !supportedPackageManager.Contains((mgr) => mgr == packageManager))
    ) {
      packageManager = CLI_Config.tryGetValue('packageManager');
    }

    if (!supportedPackageManager.Contains((mgr) => mgr == packageManager)) {
      packageManager = 'npm';
    }

    this.options['pm'] = packageManager;
    this.options['packageManager'] = packageManager;
    this.options['package-manager'] = packageManager;
  }
}
