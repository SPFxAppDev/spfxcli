#!/usr/bin/env node
import yargs from 'yargs';
import { generateCommandDefinition } from './commands/generate/generateCommandDefinition.js';
import { initCommandDefinition } from './commands/init/initCommandDefinition.js';
import { rulesCommandDefinition } from './commands/rules/rulesCommandDefinition.js';
import { configCommandDefinition } from './commands/config/configCommandDefinition.js';
import { newCommandDefinition } from './commands/new/newCommandDefinition.js';
import { CLIConfig } from './configstore/index.js';
import { hideBin } from 'yargs/helpers';
import '@spfxappdev/utility/lib/extensions/StringExtensions.js';
import '@spfxappdev/utility/lib/extensions/ArrayExtensions.js';

export const CLI_Config: CLIConfig = CLIConfig.Current();

// const testCommand = {
//   command: ['test [options...]'],
//   aliases: 't',
//   describe: 'Just for testing some code',
//   builder: (yargs): any => {},
//   handler: (argv) => {
//   },
// };

// const parser = yargs();

// const builder: any = parser
//   .scriptName('spfxappdev')
//   .alias({ shortName: 'spfx' })
//   .usage('$0 <command> [options]')
//   .command(initCommandDefinition)
//   .command(generateCommandDefinition)
//   .command(rulesCommandDefinition)
//   .command(configCommandDefinition)
//   .command(newCommandDefinition)
//   // .command(testCommand)
//   .demandCommand(1, 'Please specify a command.')
//   .help().argv;

// builder.parse();

async function run() {
  await yargs(hideBin(process.argv))
    .scriptName('spfxappdev')
    .alias({ shortName: 'spfx' })
    .usage('$0 <command> [options]')
    .command(initCommandDefinition)
    .command(generateCommandDefinition)
    .command(rulesCommandDefinition)
    .command(configCommandDefinition)
    .command(newCommandDefinition)
    // .command(testCommand)
    .demandCommand(1, 'Please specify a command.')
    .help()
    .parseAsync(); // 2. Nutze parseAsync() für asynchrone Commands
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
