import { CLI_Config } from '../../index';

export class ConfigCommandHandler {
  constructor(private readonly argv) {}

  public execute(commandType: 'all' | 'set' | 'get'): void {
    if (commandType == 'all') {
      return this.showConfig();
    }

    if (commandType == 'set') {
      return this.setConfig();
    }

    if (commandType == 'get') {
      return this.getConfig();
    }

    console.error('NO COMMAND SET');
  }

  private showConfig(): void {
    console.log(CLI_Config.getAll());
  }

  private getConfig(): void {
    console.log('Try get value by key', this.argv.key);
    console.log(CLI_Config.tryGetValue(this.argv.key));
  }

  private setConfig(): void {
    CLI_Config.setConfig(this.argv.key, this.argv.value);
  }
}
