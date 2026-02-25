import { IConfiguration } from './IConfiguration.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const defaultConfig: IConfiguration = {
  packageManager: 'npm',
  onInitCommand: {
    npmPackages: [],
  },
  sharepoint: {
    siteurl: '',
    clientId: '',
    clientSecret: '',
  },
  customRulesSettings: {
    templatesPath: path.join(__dirname, '../templates/create'),
  },
};
