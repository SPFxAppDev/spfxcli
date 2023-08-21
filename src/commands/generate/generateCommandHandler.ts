import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { replaceTpl, replaceNonAlphanumeric } from '@spfxappdev/utility';
import '@spfxappdev/utility/lib/extensions/StringExtensions';

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
      `${serviceName}.ts`
    );

    if (fileInfo.exists) {
      console.warn(
        chalk.yellow(
          'A service with the given (file)name already exist, please use another name'
        )
      );
      return;
    }

    const templateContent = fs
      .readFileSync(this.getTemplatesFile('Service.txt'))
      .toString();

    fs.writeFileSync(
      fileInfo.filePath,
      replaceTpl(templateContent, { NameOfService: serviceName })
    );

    this.modifyIndexFile(
      this.folderPaths.services,
      `export * from './${fileInfo.fileName.replace('.ts', '')}';`
    );
  }

  private generateModel(): void {
    this.createFolderIfNotExist(this.folderPaths.models);
    this.createFolderIfNotExist(this.folderPaths.modelInterfaces);

    let modelName = replaceNonAlphanumeric(this.argv.name, '');

    modelName = modelName[0].toUpperCase() + modelName.substring(1);

    const fileInfoInterface = this.generateFilePathAndCheckIfExists(
      this.folderPaths.modelInterfaces,
      `I${modelName}.ts`
    );

    if (fileInfoInterface.exists) {
      console.warn(
        chalk.yellow(
          'A model with the given (file)name already exist, please use another name'
        )
      );
      return;
    }

    const templateInterfaceContent = fs
      .readFileSync(this.getTemplatesFile('ModelInterface.txt'))
      .toString();

    fs.writeFileSync(
      fileInfoInterface.filePath,
      replaceTpl(templateInterfaceContent, { NameOfModel: modelName })
    );

    this.modifyIndexFile(
      this.folderPaths.modelInterfaces,
      `export * from './${fileInfoInterface.fileName.replace('.ts', '')}';`
    );

    const fileInfo = this.generateFilePathAndCheckIfExists(
      this.folderPaths.models,
      `${modelName}.ts`
    );

    if (fileInfo.exists) {
      console.warn(
        chalk.yellow(
          'A model with the given (file)name already exist, please use another name'
        )
      );
      return;
    }

    const templateContent = fs
      .readFileSync(this.getTemplatesFile('Model.txt'))
      .toString();

    fs.writeFileSync(
      fileInfo.filePath,
      replaceTpl(templateContent, { NameOfModel: modelName })
    );

    const modelsIndexPath = path.join(
      process.cwd(),
      'src',
      this.folderPaths.models,
      'index.ts'
    );

    const firstCreation = !fs.existsSync(modelsIndexPath);

    if (firstCreation) {
      this.modifyIndexFile(
        this.folderPaths.models,
        `export * from './interfaces';`
      );
    }

    this.modifyIndexFile(
      this.folderPaths.models,
      `export * from './${fileInfo.fileName.replace('.ts', '')}';`
    );
  }

  private modifyIndexFile(indexFolderPath: string, content: string): void {
    const indexFileInfo = this.generateFilePathAndCheckIfExists(
      indexFolderPath,
      `index.ts`
    );

    fs.appendFileSync(indexFileInfo.filePath, content + '\n');
  }

  private createFolderIfNotExist(folderName: string): void {
    const folderPath = path.join(process.cwd(), 'src', folderName);

    if (fs.existsSync(folderPath)) {
      return;
    }

    fs.mkdirSync(folderPath);
  }

  private generateFilePathAndCheckIfExists(
    folderPath: string,
    fileName: string
  ): IFileInfo {
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
}
