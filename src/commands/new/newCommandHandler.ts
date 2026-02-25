import chalk from 'chalk';
import { CLI_Config } from '../../index.js';
import { execSync } from 'child_process';
import spfxAppDevUtility from '@spfxappdev/utility';
const { isNullOrEmpty, isset } = spfxAppDevUtility;

export class NewCommandHandler {
  private options: string[] = [];

  private uniqueOptions: string[] = [];

  constructor(private readonly argv) {}

  public execute(): void {
    this.runYoMicrosoftSharePoint();
  }

  private runYoMicrosoftSharePoint(): void {
    this.createArrayForArgumentsToPass();
    const pkgMgr: string = this.setPackageManagerOption();

    let command = 'yo @microsoft/sharepoint ';
    try {
      if (!isNullOrEmpty(pkgMgr) && pkgMgr.Equals('pnpm')) {
        execSync(`pnpm config set auto-install-peers true --location project`, {
          stdio: 'inherit',
        });
        execSync(`pnpm config set shamefully-hoist true --location project`, {
          stdio: 'inherit',
        });
      }

      command += this.options.join(' ');

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

  private setPackageManagerOption(): string {
    const supportedPackageManager: string[] = ['npm', 'pnpm', 'yarn'];
    let packageManager = this.argv.pm || this.argv.packageManager;

    if (
      isNullOrEmpty(packageManager) ||
      (!isNullOrEmpty(packageManager) &&
        !supportedPackageManager.Contains((mgr) => mgr == packageManager))
    ) {
      packageManager = CLI_Config.tryGetValue('packageManager', true);
    }

    if (!supportedPackageManager.Contains((mgr) => mgr == packageManager)) {
      packageManager = 'npm';
    }

    this.options.push(`--pm ${packageManager}`);
    this.options.push(`--packageManager ${packageManager}`);
    this.options.push(`--package-manager ${packageManager}`);

    return packageManager;
  }
}
