import * as yargs from 'yargs';
import { ConfigCommandHandler } from './configCommandHandler';
import {
  allowedValues,
  allowedValuesToSet,
  allowedValuesToAddOrRemove,
} from './constants';

const showAllConfigCommandDefinition: yargs.CommandModule = {
  command: ['all'],
  describe: 'Display all config properties',
  builder: (yargs): any => {
    yargs.option('local', {
      alias: 'l',
      describe: 'If set, the local project configuration file is used',
      type: 'boolean',
      demandOption: false,
    });
  },
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
      choices: allowedValues,
      type: 'string',
      demandOption: true,
    });

    yargs.option('local', {
      alias: 'l',
      describe: 'If set, the local project configuration file is used',
      type: 'boolean',
      demandOption: false,
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
      choices: allowedValuesToSet,
      type: 'string',
      demandOption: true,
    });

    yargs.positional('value', {
      describe: 'Value to set for the key',
      demandOption: false,
      type: 'string',
    });

    yargs.option('local', {
      alias: 'l',
      describe: 'If set, the local project configuration file is used',
      type: 'boolean',
      demandOption: false,
    });
  },
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('set');
  },
};

const addConfigCommandDefinition: yargs.CommandModule = {
  command: ['add <key> <values...>'],
  describe: 'Add the specified value(s) for the specified key',
  builder: (yargs): any => {
    yargs.positional('key', {
      describe: 'Property key to set',
      choices: allowedValuesToAddOrRemove,
      type: 'string',
      demandOption: true,
    });

    yargs.positional('values', {
      describe: 'Value(s) to set for the key',
      demandOption: false,
      type: 'string',
      array: true,
    });

    yargs.option('local', {
      alias: 'l',
      describe: 'If set, the local project configuration file is used',
      type: 'boolean',
      demandOption: false,
    });
  },
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('add');
  },
};

const removeConfigCommandDefinition: yargs.CommandModule = {
  command: ['remove <key> <values...>'],
  describe: 'Removes the specified value(s) for the specified key',
  builder: (yargs): any => {
    yargs.positional('key', {
      describe: 'Property key',
      choices: allowedValuesToAddOrRemove,
      type: 'string',
      demandOption: true,
    });

    yargs.positional('values', {
      describe: 'Value(s) to delete for the key',
      demandOption: false,
      type: 'string',
      array: true,
    });

    yargs.option('local', {
      alias: 'l',
      describe: 'If set, the local project configuration file is used',
      type: 'boolean',
      demandOption: false,
    });
  },
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('remove');
  },
};

const removeAllConfigCommandDefinition: yargs.CommandModule = {
  command: ['remove-all <key>'],
  aliases: ['ra'],
  describe: 'Removes all values for the specified key',
  builder: (yargs): any => {
    yargs.positional('key', {
      describe: 'Property key',
      choices: allowedValuesToAddOrRemove,
      type: 'string',
      demandOption: true,
    });

    yargs.option('local', {
      alias: 'l',
      describe: 'If set, the local project configuration file is used',
      type: 'boolean',
      demandOption: false,
    });
  },
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('removeAll');
  },
};

const createLocalConfigCommandDefinition: yargs.CommandModule = {
  command: ['create'],
  describe:
    'Creates a new local configuration file based on the global file, but without the SP credentials',
  handler: (argv) => {
    const handler = new ConfigCommandHandler(argv);
    handler.execute('create');
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
    yargs.command(addConfigCommandDefinition);
    yargs.command(removeConfigCommandDefinition);
    yargs.command(removeAllConfigCommandDefinition);
    yargs.command(createLocalConfigCommandDefinition);
  },
  handler: (argv) => {
    yargs.showHelp();
  },
};
