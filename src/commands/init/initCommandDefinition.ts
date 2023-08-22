import { CommandModule } from 'yargs';
import { InitCommandHandler } from './initCommandHandler';

export const initCommandDefinition: CommandModule = {
  command: ['init'],
  describe: 'Initialize the project',
  handler: (argv) => {
    const handler = new InitCommandHandler(argv);
    handler.execute();
  },
};
