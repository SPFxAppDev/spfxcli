import { CommandModule } from 'yargs';
import * as Table from 'cli-table3';
import * as chalk from 'chalk';
import { GenerateCommandHandler } from './generateCommandHandler.js';

const leftMargin = '    ';
const generateCommandChoicesTable = new Table.default({
  head: ['name', 'alias', 'description'],
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

interface GenerateCommandChoice {
  name: string;
  alias: string;
  description: string;
}

//Service, Pipeline, Model (auto SP-Proxy????) ReactComponent?, ESLInt File?,
const generateCommandChoices: GenerateCommandChoice[] = [
  { name: 'service', alias: 's', description: 'Defines a new SPFx Service' },
  //TODO: create a custom command for pipeline
  // {
  //   name: 'pipeline',
  //   alias: 'p',
  //   description:
  //     'Creates a new yaml file for Azure DevOps,\nthat can be used to make a new build pipeline',
  // },
  {
    name: 'model',
    alias: 'm',
    description: '',
  },
];

for (const generateCommandChoice of generateCommandChoices) {
  generateCommandChoicesTable.push([
    chalk.default.green(generateCommandChoice.name),
    chalk.default.cyan(generateCommandChoice.alias),
    generateCommandChoice.description,
  ]);
}

export const generateCommandDefinition: CommandModule = {
  aliases: 'g',
  command: ['generate <type> <name> [options...]'],
  describe:
    'Generates and/or modifies files based on a type.\n Available choices are:\n' +
    generateCommandChoicesTable.toString(),
  builder: (yargs): any => {
    yargs.positional('type', {
      choices: ['service', 's', 'model', 'm'],
      describe: 'The type to generate.',
      type: 'string',
      demandOption: true,
    });
    yargs.positional('name', {
      describe: 'The name of the generated component.',
      demandOption: true,
      type: 'string',
    });

    yargs.options('listName', {
      alias: 'ln',
      describe: 'SharePoint List name',
      demandOption: false,
    });

    yargs.options('list', {
      alias: 'l',
      describe: 'SharePoint web relative list URL e.g. Lists/MyList or SitePages',
      demandOption: false,
    });

    yargs.options('clientId', {
      alias: 'client',
      describe: 'SharePoint App ClientId',
      demandOption: false,
    });

    yargs.options('clientSecret', {
      alias: 'secret',
      describe: 'The SharePoint App client secret',
      demandOption: false,
    });

    yargs.options('weburl', {
      alias: 'u',
      describe: 'The absolute URL of the website where the list is located',
      demandOption: false,
    });

    yargs.options('hidden', {
      type: 'boolean',
      describe: 'Create the model and include the hidden fields as well',
      demandOption: false,
    });
  },
  handler: (argv) => {
    const handler = new GenerateCommandHandler(argv);
    handler.execute();
  },
};
