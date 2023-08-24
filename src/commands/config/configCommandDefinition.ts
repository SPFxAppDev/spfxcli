import * as yargs from 'yargs';
import { ConfigCommandHandler } from './configCommandHandler';

const showAllConfigCommandDefinition: yargs.CommandModule = {
  command: ['all'],
  describe: 'Display all config properties',
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('all');
  },
};

const getConfigCommandDefinition: yargs.CommandModule = {
  command: ['get <key>'],
  describe: 'Shows the value of the specified key',
  builder: (yargs): any => {
    yargs.positional('key', {
      describe: 'Property key to get',
      type: 'string',
      demandOption: true,
    });
  },
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('get');
  },
};

const setConfigCommandDefinition: yargs.CommandModule = {
  command: ['set <key> <value>'],
  describe: 'Sets the specified value for the specified key',
  builder: (yargs): any => {
    yargs.positional('key', {
      describe: 'Property key to set',
      type: 'string',
      demandOption: true,
    });

    yargs.positional('value', {
      describe: 'Value to set for the key',
      demandOption: false,
      type: 'string',
    });
  },
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('set');
  },
};

export const configCommandDefinition: yargs.CommandModule = {
  command: ['config'],
  aliases: ['c'],
  describe: 'Gets or sets a custom configuration setting',
  builder: (yargs): any => {
    yargs.command(showAllConfigCommandDefinition);
    yargs.command(getConfigCommandDefinition);
    yargs.command(setConfigCommandDefinition);
  },
  handler: (argv) => {
    yargs.showHelp();
  },
};
