#!/usr/bin/env node
import * as yargs from 'yargs';
import { generateCommandDefinition } from './commands/generate/generateCommandDefinition';
import { initCommandDefinition } from './commands/init/initCommandDefinition';
import { rulesCommandDefinition } from './commands/rules/rulesCommandDefinition';
import { configCommandDefinition } from './commands/config/configCommandDefinition';
import { CLIConfig } from './configstore';

export const CLI_Config: CLIConfig = CLIConfig.Current();

const builder: any = yargs
  .scriptName('spfxappdev')
  .usage('$0 <command> [options]')
  .command(initCommandDefinition)
  .command(generateCommandDefinition)
  .command(rulesCommandDefinition)
  .command(configCommandDefinition)
  .demandCommand(1, 'Please specify a command.')
  .help().argv;
