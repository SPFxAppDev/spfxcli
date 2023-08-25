import { CommandModule } from 'yargs';
import { InitCommandHandler } from './initCommandHandler';

export const initCommandDefinition: CommandModule = {
  command: ['init'],
  describe: 'Initialize the project',
  builder: (yargs): any => {
    yargs.option('package-manager', {
      alias: 'pm',
      describe:
        'If additional packages are to be installed (specified in config), the package manager can be specified here (npm, pnpm or yarn). Otherwise the package manager from the config (default npm) is used',
      choices: ['npm', 'pnpm', 'yarn'],
      type: 'string',
      demandOption: false,
    });

    yargs.option('install', {
      describe:
        'The specified npmPackages from the configuration file should (not) be installed',
      type: 'boolean',
      demandOption: false,
    });
  },
  handler: (argv) => {
    const handler = new InitCommandHandler(argv);
    handler.execute();
  },
};
