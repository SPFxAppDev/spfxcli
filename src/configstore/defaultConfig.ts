import { IConfiguration } from './IConfiguration';
import * as path from 'path';

export const defaultConfig: IConfiguration = {
  packageManager: 'npm',
  onInitCommand: {
    npmPackages: [],
  },
  customRulesSettings: {
    templatesPath: path.join(__dirname, '../templates/create'),
  },
};
