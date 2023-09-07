import { IConfiguration } from './IConfiguration';
import * as path from 'path';

export const defaultConfig: IConfiguration = {
  packageManager: 'npm',
  onInitCommand: {
    npmPackages: [],
  },
  sharepoint: {
    siteurl: '',
    password: '',
    username: '',
  },
  customRulesSettings: {
    templatesPath: path.join(__dirname, '../templates/create'),
  },
};
