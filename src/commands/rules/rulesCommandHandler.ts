import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CLI_Config } from '../../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface IFileInfo {
  folderPath: string;
  fileName: string;
  filePath: string;
  exists: boolean;
}

export class RulesCommandHandler {
  constructor(private readonly argv) {}

  public execute(): void {
    const msTsConfigFileName: string = 'ms-tsconfig.json';
    const msESLintFileName: string = 'ms-eslint.js';
    const esLintFileName: string = '.eslintrc.js';
    const tsConfigFileName: string = 'tsconfig.json';

    const msTSFileInfo =
      this.generateFilePathAndCheckIfExists(msTsConfigFileName);
    const msESLintFileInfo =
      this.generateFilePathAndCheckIfExists(msESLintFileName);
    const customTSFileInfo =
      this.generateFilePathAndCheckIfExists(tsConfigFileName);
    const customESLintFileInfo =
      this.generateFilePathAndCheckIfExists(esLintFileName);

    if (msESLintFileInfo.exists && msTSFileInfo.exists) {
      console.log(
        chalk.green(
          '\u2713 It looks like you have already added custom rules before, skipping command.'
        )
      );
      return;
    }

    if (!msESLintFileInfo.exists) {
      if (!customESLintFileInfo.exists) {
        console.log(chalk.yellow('\u26A0 no eslintfile exists.'));
      } else {
        fs.rename(
          customESLintFileInfo.filePath,
          msESLintFileInfo.filePath,
          () => {
            console.log(
              chalk.green(
                `\u2713 renamed original ${esLintFileName} to ${msESLintFileName}`
              )
            );

            const templateContent = fs
              .readFileSync(this.getTemplatesFile('eslint.js.txt'))
              .toString();

            fs.writeFileSync(customESLintFileInfo.filePath, templateContent);

            console.log(
              chalk.green(
                `\u2713 successfully created custom ${esLintFileName} file`
              )
            );
          }
        );
      }
    }

    if (!msTSFileInfo.exists) {
      if (!customTSFileInfo.exists) {
        console.log(chalk.yellow('\u26A0 no tsconfig.json file exists.'));
      } else {
        fs.rename(customTSFileInfo.filePath, msTSFileInfo.filePath, () => {
          console.log(
            chalk.green(
              `\u2713 renamed original ${tsConfigFileName} to ${msTsConfigFileName}`
            )
          );

          const templateContent = fs
            .readFileSync(this.getTemplatesFile('tsconfig.txt'))
            .toString();

          fs.writeFileSync(customTSFileInfo.filePath, templateContent);

          console.log(
            chalk.green(
              `\u2713 successfully created custom ${tsConfigFileName} file`
            )
          );
        });
      }
    }
  }

  private generateFilePathAndCheckIfExists(fileName: string): IFileInfo {
    const folderPath = process.cwd();
    const filePath = path.join(folderPath, fileName);

    const exists: boolean = fs.existsSync(filePath);

    return {
      folderPath: folderPath,
      fileName: fileName,
      filePath: filePath,
      exists: exists,
    };
  }

  private getTemplatesFile(fileName: string) {
    const customPathValue = CLI_Config.tryGetValue('customRulesSettings.templatesPath', true);
    const customPath = path.join(customPathValue, '/', fileName);
    const exists: boolean = fs.existsSync(customPath);

    if (exists) {
      return customPath;
    }

    const basePath = 'templates/create/';

    return path.join(__dirname, '../../', basePath + fileName);
  }
}
