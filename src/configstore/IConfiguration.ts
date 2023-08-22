export interface IOnInitCommand {
  npmPackages: string[];
}

export interface ICustomRulesSettings {
  templatesPath: string;
}

export interface IConfiguration {
  onInitCommand: IOnInitCommand;
  customRulesSettings: ICustomRulesSettings;
}
