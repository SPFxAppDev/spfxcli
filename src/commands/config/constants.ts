export const allowedValues: string[] = [
  'packageManager',
  'npmPackages',
  'templatesPath',
  'clientId',
  'clientSecret',
  'siteurl',
];

export const allowedValuesToSet: string[] = [
  'templatesPath',
  'packageManager',
  'clientId',
  'clientSecret',
  'siteurl',
];

export const allowedValuesToAddOrRemove: string[] = ['npmPackages'];

export const supportedPackageManager: string[] = ['npm', 'pnpm', 'yarn'];

export const pathForKey: Record<string, string> = {
  packageManager: 'packageManager',
  npmPackages: 'onInitCommand.npmPackages',
  templatesPath: 'customRulesSettings.templatesPath',
  clientId: 'sharepoint.clientId',
  clientSecret: 'sharepoint.clientSecret',
  siteurl: 'sharepoint.siteurl',
};
