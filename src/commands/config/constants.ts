export const allowedValues: string[] = [
  'packageManager',
  'npmPackages',
  'templatesPath',
  'username',
  'password',
  'siteurl',
];

export const allowedValuesToSet: string[] = [
  'templatesPath',
  'packageManager',
  'username',
  'password',
  'siteurl',
];

export const allowedValuesToAddOrRemove: string[] = ['npmPackages'];

export const supportedPackageManager: string[] = ['npm', 'pnpm', 'yarn'];

export const pathForKey: Record<string, string> = {
  packageManager: 'packageManager',
  npmPackages: 'onInitCommand.npmPackages',
  templatesPath: 'customRulesSettings.templatesPath',
  username: 'sharepoint.username',
  password: 'sharepoint.password',
  siteurl: 'sharepoint.siteurl',
};
