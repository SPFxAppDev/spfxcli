import { IConfiguration } from './IConfiguration';
import * as path from 'path';

export const defaultConfig: IConfiguration = {
  onInitCommand: {
    npmPackages: [],
  },
  customRulesSettings: {
    templatesPath: path.join(__dirname, '../templates/create'),
  },
};
