export interface IOnInitCommand {
  npmPackages: string[];
}

export interface ICustomRulesSettings {
  templatesPath: string;
}

export interface IConfiguration {
  packageManager: string;
  onInitCommand: IOnInitCommand;
  customRulesSettings: ICustomRulesSettings;
}
