import { allAreNullOrEmpty, getDeepOrDefault, isNullOrEmpty, isset } from '@spfxappdev/utility';
import { CLI_Config } from '../index';
import { IAuthOptions } from 'sp-request';
import * as fs from 'fs';
import * as path from 'path';
import * as CryptoJS from 'crypto-js';
import { LocalConfigStore } from '../configstore';

export class SPCredentialManager {
  private readonly cliSecretKey: string = `SPFxAppDevSecretCLI_7105e8a7-2d3c-492a-803c-79ed74b2a1fd`;

  constructor(private readonly argv) {}

  public getSPCredentials(): IAuthOptions {
    let options = this.readFromArguments();

    if (isset(options)) {
      return options;
    }

    options = this.readFromProjectFile();

    if (isset(options)) {
      return options;
    }

    options = this.readFromGlobalConfigFile();

    if (isset(options)) {
      return options;
    }

    return null;
  }

  public createEncryptedPassword(plainPassword: string, locally: boolean): string {
    if (!locally) {
      return this.encryptPassword(plainPassword, this.cliSecretKey);
    }

    const packageJson = this.getSPFxPackageFile();

    if (!isset(packageJson)) {
      console.log(
        `Password for local config file cannot be encrypted because '/config/package-solution.json' does not exist`
      );
      return null;
    }

    const solutionId: string = getDeepOrDefault<string>(packageJson, 'solution.id');

    return this.encryptPassword(plainPassword, `${this.cliSecretKey}_${solutionId}`);
  }

  private readFromArguments(): IAuthOptions {
    const { username, password } = this.argv;

    if (allAreNullOrEmpty(username, password)) {
      return null;
    }

    const options: IAuthOptions = {
      username: username,
      password: password,
    };

    return options;
  }

  private readFromProjectFile(): IAuthOptions {
    const localConfigStore = LocalConfigStore.Current();

    if (!localConfigStore.localConfigExists) {
      return null;
    }

    const packageJson = this.getSPFxPackageFile();

    if (!isset(packageJson)) {
      console.log(
        `The local configuration file exists, but the SPFx file /config/package-solution.json does not. The password cannot be decrypted`
      );
      return null;
    }

    const solutionId: string = getDeepOrDefault<string>(packageJson, 'solution.id');

    const encryptedPassword: string = localConfigStore.tryGetValue('sharepoint.password');

    const options: IAuthOptions = {
      username: localConfigStore.tryGetValue('sharepoint.username'),
      password: this.decryptPassword(encryptedPassword, `${this.cliSecretKey}_${solutionId}`),
    };

    return options;
  }

  private readFromGlobalConfigFile(): IAuthOptions {
    const userName = CLI_Config.tryGetValue('sharepoint.username', false);
    const encryptedPassword = CLI_Config.tryGetValue('sharepoint.password', false);

    const options: IAuthOptions = {
      username: userName,
      password: this.decryptPassword(encryptedPassword, `${this.cliSecretKey}`),
    };

    return options;
  }

  private getSPFxPackageFile(): any {
    const packagePath = path.join(process.cwd(), '/config/package-solution.json');

    const packagePathExists: boolean = fs.existsSync(packagePath);

    if (!packagePathExists) {
      return null;
    }

    const packageString = fs.readFileSync(packagePath).toString();
    const packageJson = JSON.parse(packageString);
    return packageJson;
  }

  private encryptPassword(plainPassword: string, secret: string): string {
    return CryptoJS.AES.encrypt(plainPassword, secret).toString(CryptoJS.format.OpenSSL);
  }

  private decryptPassword(cipherText: string, secret: string): string {
    if (isNullOrEmpty(cipherText)) {
      return null;
    }

    const bytes = CryptoJS.AES.decrypt(cipherText, secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
