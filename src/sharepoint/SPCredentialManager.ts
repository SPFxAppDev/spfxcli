import { allAreNullOrEmpty, getDeepOrDefault, isNullOrEmpty, isset } from '@spfxappdev/utility';
import { CLI_Config } from '../index';
import { LocalConfigStore } from '../configstore';
import { Configuration } from '@azure/msal-node';

export class SPCredentialManager {
  private readonly cliSecretKey: string = `SPFxAppDevSecretCLI_7105e8a7-2d3c-492a-803c-79ed74b2a1fd`;

  constructor(private readonly argv) {}

  public getSPCredentials(): Configuration {
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

  // public createEncryptedPassword(plainPassword: string, locally: boolean): string {
  //   if (!locally) {
  //     return this.encryptPassword(plainPassword, this.cliSecretKey);
  //   }

  //   const packageJson = this.getSPFxPackageFile();

  //   if (!isset(packageJson)) {
  //     console.log(
  //       `Password for local config file cannot be encrypted because '/config/package-solution.json' does not exist`,
  //     );
  //     return null;
  //   }

  //   const solutionId: string = getDeepOrDefault<string>(packageJson, 'solution.id');

  //   return this.encryptPassword(plainPassword, `${this.cliSecretKey}_${solutionId}`);
  // }

  private readFromArguments(): Configuration {
    const { clientId, clientSecret } = this.argv;

    if (allAreNullOrEmpty(clientId, clientSecret)) {
      return null;
    }

    const options: Configuration = {
      auth: {
        clientId: clientId,
        clientSecret: clientSecret,
      },
    };

    return options;
  }

  private readFromProjectFile(): Configuration {
    const localConfigStore = LocalConfigStore.Current();

    if (!localConfigStore.localConfigExists) {
      return null;
    }

    const clientId: string = localConfigStore.tryGetValue('sharepoint.clientId');
    const clientSecret: string | undefined =
      localConfigStore.tryGetValue('sharepoint.clientSecret') || undefined;

    const options: Configuration = {
      auth: {
        clientId: clientId,
        clientSecret: clientSecret,
      },
    };

    return options;
  }

  private readFromGlobalConfigFile(): Configuration {
    const clientId: string = CLI_Config.tryGetValue('sharepoint.clientId', false);
    const clientSecret: string | undefined =
      CLI_Config.tryGetValue('sharepoint.clientSecret', false) || undefined;

    const options: Configuration = {
      auth: {
        clientId: clientId,
        clientSecret: clientSecret,
      },
    };

    return options;
  }

  public async getTenantId(siteUrl: string): Promise<string> {
    const response = await fetch(`${siteUrl}/_vti_bin/client.svc/`, {
      headers: { Authorization: 'Bearer ' },
    });
    const tenantId = response.headers.get('www-authenticate')?.match(/realm="([^"]+)"/)?.[1];

    return tenantId;
  }
}
