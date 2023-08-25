import { CommandModule } from 'yargs';
import { NewCommandHandler } from './newCommandHandler';

export const newCommandDefinition: CommandModule = {
  command: ['new [options...]'],
  describe:
    'Create a new SPFx project by running yo @microsoft/sharepoint. You can use all available arguments of yo @microsoft/sharepoint, such as --skip-install or --package-manager. See yo @microsoft/sharepoint --help',
  builder: (yargs): any => {},
  handler: (argv) => {
    const handler = new NewCommandHandler(argv);
    handler.execute();
  },
};
