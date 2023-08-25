export const allowedValues: string[] = [
  'packageManager',
  'npmPackages',
  'templatesPath',
];

export const allowedValuesToSet: string[] = ['templatesPath', 'packageManager'];

export const allowedValuesToAddOrRemove: string[] = ['npmPackages'];

export const supportedPackageManager: string[] = ['npm', 'pnpm', 'yarn'];

export const pathForKey: Record<string, string> = {
  packageManager: 'packageManager',
  npmPackages: 'onInitCommand.npmPackages',
  templatesPath: 'customRulesSettings.templatesPath',
};
