#!/usr/bin/env node
import * as yargs from 'yargs';
import { generateCommandDefinition } from './commands/generate/generateCommandDefinition';
import { initCommandDefinition } from './commands/init/initCommandDefinition';
import { rulesCommandDefinition } from './commands/rules/rulesCommandDefinition';
import { configCommandDefinition } from './commands/config/configCommandDefinition';
import { newCommandDefinition } from './commands/new/newCommandDefinition';
import { CLIConfig } from './configstore';
import '@spfxappdev/utility/lib/extensions/StringExtensions';
import '@spfxappdev/utility/lib/extensions/ArrayExtensions';

export const CLI_Config: CLIConfig = CLIConfig.Current();

const builder: any = yargs
  .scriptName('spfxappdev')
  .alias({ shortName: 'spfx' })
  .usage('$0 <command> [options]')
  .command(initCommandDefinition)
  .command(generateCommandDefinition)
  .command(rulesCommandDefinition)
  .command(configCommandDefinition)
  .command(newCommandDefinition)
  .demandCommand(1, 'Please specify a command.')
  .help().argv;
