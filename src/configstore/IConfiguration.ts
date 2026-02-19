export interface IOnInitCommand {
  npmPackages: string[];
}

export interface ICustomRulesSettings {
  templatesPath: string;
}

export interface ISharePointSettings {
  siteurl: string;
  clientId: string;
  clientSecret: string;
}

export interface IConfiguration {
  packageManager: string;
  onInitCommand: IOnInitCommand;
  sharepoint: ISharePointSettings;
  customRulesSettings: ICustomRulesSettings;
}
