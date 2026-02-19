import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  ModelTemplate,
  ISharePointModelOptions,
  SharePointModelTemplateGenerator,
} from './sharePointModelTemplateGenerator.js';
import { SPCredentialManager } from '../../sharepoint/SPCredentialManager.js';
import * as readline from 'readline';
import { CLIConfig } from '../../configstore/index.js';
import { Configuration } from '@azure/msal-node';
import {
  PersistenceCreator,
  PersistenceCachePlugin,
  DataProtectionScope,
} from '@azure/msal-node-extensions';

import spfxAppDevUtility from '@spfxappdev/utility';
const { replaceTpl, replaceNonAlphanumeric, isNullOrEmpty, getDeepOrDefault, allAreNullOrEmpty } =
  spfxAppDevUtility;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IFileInfo {
  folderPath: string;
  fileName: string;
  filePath: string;
  exists: boolean;
}

export class GenerateCommandHandler {
  private folderPaths = {
    services: 'services',
    models: 'models',
    modelInterfaces: 'models/interfaces',
    spFields: 'models/spFieldTypes',
    pipeline: '',
    templates: 'templates/create/',
  };

  constructor(private readonly argv) {}

  public execute(): void {
    const componentType = this.argv.type;

    if (componentType == 's' || componentType == 'service') {
      this.generateService();
    }

    if (componentType == 'm' || componentType == 'model') {
      this.generateModel();
    }
  }

  private generateService(): void {
    this.createFolderIfNotExist(this.folderPaths.services);

    let serviceName: string = this.argv.name;

    serviceName = serviceName[0].toUpperCase() + serviceName.substring(1);

    if (!serviceName.EndsWith('service', true)) {
      serviceName += 'Service';
    }

    serviceName = replaceNonAlphanumeric(serviceName, '');

    const fileInfo = this.generateFilePathAndCheckIfExists(
      this.folderPaths.services,
      `${serviceName}.ts`,
    );

    if (fileInfo.exists) {
      console.warn(
        chalk.yellow('A service with the given (file)name already exist, please use another name'),
      );
      return;
    }

    const templateContent = fs.readFileSync(this.getTemplatesFile('Service.txt')).toString();

    fs.writeFileSync(
      fileInfo.filePath,
      replaceTpl(templateContent, { NameOfService: serviceName }),
    );

    this.modifyIndexFile(
      this.folderPaths.services,
      `export * from './${fileInfo.fileName.replace('.ts', '')}';`,
    );
  }

  private async generateModel(): Promise<void> {
    this.createFolderIfNotExist(this.folderPaths.models);
    this.createFolderIfNotExist(this.folderPaths.modelInterfaces);

    let modelName = replaceNonAlphanumeric(this.argv.name, '');

    modelName = modelName[0].toUpperCase() + modelName.substring(1);

    const fileInfoInterface = this.generateFilePathAndCheckIfExists(
      this.folderPaths.modelInterfaces,
      `I${modelName}.ts`,
    );

    if (fileInfoInterface.exists) {
      console.warn(
        chalk.yellow('A model with the given (file)name already exist, please use another name'),
      );
      return;
    }

    const modelsIndexPath = path.join(process.cwd(), 'src', this.folderPaths.models, 'index.ts');

    const firstCreation = !fs.existsSync(modelsIndexPath);

    if (firstCreation) {
      this.modifyIndexFile(this.folderPaths.models, `export * from './interfaces';`);
    }

    const template: ModelTemplate = await this.generateSharePointModel();

    const templateInterfaceContent = fs
      .readFileSync(this.getTemplatesFile('ModelInterface.txt'))
      .toString();

    // fs.writeFileSync(
    //   fileInfoInterface.filePath,
    //   replaceTpl(templateInterfaceContent, {
    //     NameOfModel: modelName,
    //     ModelMembers: template.interfaceContent,
    //     AdditionalImports: template.interfaceImports,
    //   }),
    // );

    // this.modifyIndexFile(
    //   this.folderPaths.modelInterfaces,
    //   `export * from './${fileInfoInterface.fileName.replace('.ts', '')}';`,
    // );

    // const fileInfo = this.generateFilePathAndCheckIfExists(
    //   this.folderPaths.models,
    //   `${modelName}.ts`,
    // );

    // if (fileInfo.exists) {
    //   console.warn(
    //     chalk.yellow('A model with the given (file)name already exist, please use another name'),
    //   );
    //   return;
    // }

    // const templateContent = fs.readFileSync(this.getTemplatesFile('Model.txt')).toString();

    // fs.writeFileSync(
    //   fileInfo.filePath,
    //   replaceTpl(templateContent, {
    //     NameOfModel: modelName,
    //     ModelMembers: template.classContent,
    //     AdditionalImports: template.classImports,
    //   }),
    // );

    // if (template.classContent.Contains('@mapper', true)) {
    //   console.log(
    //     chalk.blue(
    //       'A model was created based on SharePoint list. The model uses the @spfxappdev/mapper decorators. Please make sure that you have installed the dependency via npm/pnpm/yarn i @spfxappdev/mapper.',
    //     ),
    //   );
    // }

    // this.modifyIndexFile(
    //   this.folderPaths.models,
    //   `export * from './${fileInfo.fileName.replace('.ts', '')}';`,
    // );
  }

  private async generateSharePointModel(): Promise<ModelTemplate> {
    if (allAreNullOrEmpty(this.argv.list, this.argv.listName)) {
      return SharePointModelTemplateGenerator.EmptyModel;
    }

    const spCredManager: SPCredentialManager = new SPCredentialManager(this.argv);
    const authOptions: Configuration = spCredManager.getSPCredentials();
    const showClientSecretPrompt: boolean = isNullOrEmpty(authOptions.auth.clientId);

    while (isNullOrEmpty(authOptions.auth.clientId)) {
      authOptions.auth.clientId = await this.readUserInput('App ClientId: ');
    }

    if (showClientSecretPrompt) {
      const clientSecret = await this.readUserInput(
        'App Client Secret (leave empty for device code login): ',
      );

      if (isNullOrEmpty(clientSecret)) {
        authOptions.auth.clientSecret = undefined;
      }
    }

    let siteUrl = getDeepOrDefault<string>(
      this.argv,
      'weburl',
      CLIConfig.Current().tryGetValue('sharepoint.siteurl'),
    );

    while (isNullOrEmpty(siteUrl)) {
      siteUrl = await this.readUserInput('Site Url: ');
    }

    const tenantId = await spCredManager.getTenantId(siteUrl);
    authOptions.auth.authority = `https://login.microsoftonline.com/${tenantId}`;

    if (isNullOrEmpty(authOptions.auth.clientSecret)) {
      const cachePath = path.join(process.cwd(), 'msal_cache.json');
      const persistence = await PersistenceCreator.createPersistence({
        cachePath,
        dataProtectionScope: DataProtectionScope.CurrentUser,
        usePlaintextFileOnLinux: true,
      });

      authOptions.cache = {
        cachePlugin: new PersistenceCachePlugin(persistence),
      };
    }

    const spModelOptions: ISharePointModelOptions = {
      webUrl: siteUrl,
      listUrl: this.argv.list,
      listName: this.argv.listName,
      authConfiguration: authOptions,
      includeHiddenFields: this.argv.hidden || false,
      selectFields: '',
    };

    const generator: SharePointModelTemplateGenerator = new SharePointModelTemplateGenerator(
      spModelOptions,
    );

    const template: ModelTemplate = await generator.generate();

    if (isNullOrEmpty(template.classContent) && isNullOrEmpty(template.interfaceContent)) {
      return template;
    }

    // this.createFolderIfNotExist(this.folderPaths.spFields);

    // const modelsIndexPath = path.join(process.cwd(), 'src', this.folderPaths.spFields, 'index.ts');

    // const firstCreation = !fs.existsSync(modelsIndexPath);

    // if (!firstCreation) {
    //   return template;
    // }

    // this.modifyIndexFile(this.folderPaths.models, `export * from './spFieldTypes';`);

    // const indexContent = fs.readFileSync(this.getTemplatesFile('SPFieldsIndex.ts.txt')).toString();

    // const fileInfoIndex = this.generateFilePathAndCheckIfExists(
    //   this.folderPaths.spFields,
    //   `index.ts`,
    // );

    // fs.writeFileSync(fileInfoIndex.filePath, indexContent);

    // const urlContent = fs.readFileSync(this.getTemplatesFile('UrlFieldValue.ts.txt')).toString();

    // const fileInfoUrl = this.generateFilePathAndCheckIfExists(
    //   this.folderPaths.spFields,
    //   `UrlFieldValue.ts`,
    // );

    // fs.writeFileSync(fileInfoUrl.filePath, urlContent);

    // const taxonomyContent = fs
    //   .readFileSync(this.getTemplatesFile('TaxonomyFieldValue.ts.txt'))
    //   .toString();

    // const fileInfoTaxonomy = this.generateFilePathAndCheckIfExists(
    //   this.folderPaths.spFields,
    //   `TaxonomyFieldValue.ts`,
    // );

    // fs.writeFileSync(fileInfoTaxonomy.filePath, taxonomyContent);

    // const geoLocContent = fs
    //   .readFileSync(this.getTemplatesFile('GeoLocationFieldValue.ts.txt'))
    //   .toString();

    // const fileInfoGeoLoc = this.generateFilePathAndCheckIfExists(
    //   this.folderPaths.spFields,
    //   `GeoLocationFieldValue.ts`,
    // );

    // fs.writeFileSync(fileInfoGeoLoc.filePath, geoLocContent);

    return template;
  }

  private modifyIndexFile(indexFolderPath: string, content: string): void {
    const indexFileInfo = this.generateFilePathAndCheckIfExists(indexFolderPath, `index.ts`);

    fs.appendFileSync(indexFileInfo.filePath, content + '\n');
  }

  private createFolderIfNotExist(folderName: string): void {
    const folderPath = path.join(process.cwd(), 'src', folderName);

    if (fs.existsSync(folderPath)) {
      return;
    }

    fs.mkdirSync(folderPath);
  }

  private generateFilePathAndCheckIfExists(folderPath: string, fileName: string): IFileInfo {
    const filePath = path.join(process.cwd(), 'src', folderPath, fileName);

    const exists: boolean = fs.existsSync(filePath);

    return {
      folderPath: folderPath,
      fileName: fileName,
      filePath: filePath,
      exists: exists,
    };
  }

  private getTemplatesFile(fileName: string) {
    const basePath = this.folderPaths.templates;

    //return path.join(__dirname, '..', basePath + fileName);
    return path.join(__dirname, '../../', basePath + fileName);
  }

  private readUserInput(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise<string>((resolve) => {
      rl.question(question, (enteredText) => {
        rl.close();
        return resolve(enteredText);
      });
    });
  }
}
