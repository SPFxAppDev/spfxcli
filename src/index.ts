#!/usr/bin/env node
import * as yargs from 'yargs';
import { generateCommandDefinition } from './commands/generate/generateCommandDefinition';
import { initCommandDefinition } from './commands/init/initCommandDefinition';
import { rulesCommandDefinition } from './commands/rules/rulesCommandDefinition';

const builder: any = yargs
  .scriptName('spfxappdev')
  .usage('$0 <command> [options]')
  .command(initCommandDefinition)
  .command(generateCommandDefinition)
  .command(rulesCommandDefinition)
  .demandCommand(1, 'Please specify a command.')
  .help().argv;
