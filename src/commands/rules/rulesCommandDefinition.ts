import { CommandModule } from 'yargs';
import { RulesCommandHandler } from './rulesCommandHandler';

export const rulesCommandDefinition: CommandModule = {
  command: ['custom-rules'],
  aliases: ['rules'],
  describe:
    'Renames the default .eslintrc.js and tsconfig.json files and creates new files that inherit from the original file',
  handler: (argv) => {
    const handler = new RulesCommandHandler(argv);
    handler.execute();
  },
};
