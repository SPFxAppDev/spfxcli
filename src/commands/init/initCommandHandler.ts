import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import replace from 'replace-in-file';
import detectIndent from 'detect-indent';
import { CLI_Config } from '../../index';
import { execSync } from 'child_process';
import { isNullOrEmpty, isset } from '@spfxappdev/utility';

const spfxAppDevFolderName: string = '@spfxappdev';

export class InitCommandHandler {
  constructor(private readonly argv) {}

  public execute(): void {
    this.createSPFxAppDevFolder();
    this.extendGulpFile();
    this.extendTSConfigFile();
    this.extendFastServeWebPackIfExist();
    this.extendPackageFile();
    this.installCustomPackages();
  }

  private createSPFxAppDevFolder(): void {
    const spfxAppDevFolder = path.join(process.cwd(), spfxAppDevFolderName);

    if (!fs.existsSync(spfxAppDevFolder)) {
      fs.mkdirSync(spfxAppDevFolder);
    }

    const source = this.getTemplatesFile('');

    if (!fs.lstatSync(source).isDirectory()) {
      return;
    }

    // Copy
    let files = fs.readdirSync(source);
    files.forEach((file) => {
      var curSource = path.join(source, file);
      this.copyFileSync(curSource, spfxAppDevFolder);
    });
  }

  private extendGulpFile(): void {
    const gulpfilePath = path.join(process.cwd(), 'gulpfile.js');
    const gulpfileString = fs.readFileSync(gulpfilePath).toString();

    if (gulpfileString.indexOf('./@spfxappdev') !== -1) {
      console.log(
        chalk.green(
          '\u2713 It looks like your gulpfile.js was patched before, skipping.'
        )
      );
      return;
    }

    const options = {
      files: gulpfilePath,
      from: /build\.initialize.*/g,
      to: `
/* CUSTOM ALIAS AND VERSION BUMP AND OTHER SPFxAppDev TASKS START */
build.addSuppression(/Warning - \[sass\] The local CSS class/gi);

const { resolveCustomAlias, registerBumbVersionTask, disableWarningsCommandDefinition } = require('./@spfxappdev');
resolveCustomAlias(build);
// You can use the "gulp bump-version" command. See here: https://spfx-app.dev/package-spfx-solution-with-one-command-and-automatically-increase-the-version
registerBumbVersionTask(build);
// You can use the "gulp build --ship --warnoff" command. This prevents warnings from causing the build to fail
disableWarningsCommandDefinition(build);
/* CUSTOM ALIAS AND VERSION BUMP AND OTHER SPFxAppDev TASKS END */

build.initialize(require('gulp'));
        `,
    };

    replace.sync(options);

    console.log(chalk.green('\u2713 gulpfile.js successfully extended.'));
  }

  private extendTSConfigFile(): void {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const tsconfigString = fs.readFileSync(tsconfigPath).toString();
    const indent = detectIndent(tsconfigString).indent || '  ';
    const tsconfigJson = JSON.parse(tsconfigString);

    const compilerOptions = tsconfigJson.compilerOptions;

    if (!compilerOptions) {
      console.warn(
        chalk.yellow(
          '\u26A0 compilerOptions were not found in your tsconfig.json, skip modifying'
        )
      );
      return;
    }

    if (compilerOptions.baseUrl) {
      console.warn(
        chalk.yellow(
          '\u26A0 Your tsconfig.json baseUrl  property will be replaced.'
        )
      );
    }

    compilerOptions.paths = compilerOptions.paths || {};
    if (compilerOptions.paths['@src/*']) {
      console.warn(
        chalk.yellow(
          "\u26A0 Your tsconfig.json path  '@src/*' will be replaced."
        )
      );
    }

    if (compilerOptions.paths['@components/*']) {
      console.warn(
        chalk.yellow(
          "\u26A0 Your tsconfig.json path  '@components/*' will be replaced."
        )
      );
    }

    if (compilerOptions.paths['@webparts/*']) {
      console.warn(
        chalk.yellow(
          "\u26A0 Your tsconfig.json path  '@webparts/*' will be replaced."
        )
      );
    }

    compilerOptions.baseUrl = '.';
    compilerOptions.paths['@src/*'] = ['src/*'];
    compilerOptions.paths['@components/*'] = ['src/components/*'];
    compilerOptions.paths['@webparts/*'] = ['src/webparts/*'];

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigJson, null, indent));

    console.log(chalk.green('\u2713 tsconfig.json successfully extended.'));
  }

  private extendFastServeWebPackIfExist(): void {
    const webpackPath = path.join(
      process.cwd(),
      'fast-serve/webpack.extend.js'
    );

    if (!fs.existsSync(webpackPath)) {
      console.log(
        chalk.green(
          '\u2713 It looks like you have not installed spfx-fast-serve, skipping.'
        )
      );
      return;
    }

    const webpackExtendString = fs.readFileSync(webpackPath).toString();

    if (webpackExtendString.indexOf('alias:') !== -1) {
      console.log(
        chalk.green(
          '\u2713 It looks like your fast-serve/webpack.extend.js was patched before, skipping.'
        )
      );
      return;
    }

    const options = {
      files: webpackPath,
      from: /const webpackConfig.*\{/g,
      to: `
          
  const path = require('path');
  const webpackConfig = {
  /* CUSTOM ALIAS START */
  resolve: {
      alias: {
        "@webparts": path.resolve(__dirname, "..", "src/webparts"),
        "@components": path.resolve(__dirname, "..", "src/components"),
        "@src": path.resolve(__dirname, "..", "src"),
      }
  },
  /* CUSTOM ALIAS END */
          `,
    };

    replace.sync(options);

    console.log(
      chalk.green('\u2713 fast-serve/webpack.extend.js successfully extended.')
    );
  }

  private extendPackageFile(): void {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageString = fs.readFileSync(packagePath).toString();
    const indent = detectIndent(packageString).indent || '  ';
    const packageJson = JSON.parse(packageString);

    packageJson.scripts = packageJson.scripts || {};
    if (packageJson.scripts['publish']) {
      console.warn(
        chalk.yellow("\u26A0 Your npm 'publish' command will be replaced.")
      );
    }

    if (packageJson.scripts['postpublish']) {
      console.warn(
        chalk.yellow("\u26A0 Your npm 'postpublish' command will be replaced.")
      );
    }

    if (packageJson.scripts['publish:nowarn']) {
      console.warn(
        chalk.yellow(
          "\u26A0 Your npm 'publish:nowarn' command will be replaced."
        )
      );
    }

    packageJson.scripts['publish:nowarn'] = 'npm run publish -- --warnoff';
    packageJson.scripts['publish'] =
      'gulp clean && gulp build && gulp bundle --ship';
    packageJson.scripts['postpublish'] = 'gulp package-solution --ship';

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, indent));

    console.log(
      chalk.green(
        "\u2713 You can now use 'npm run publish' to build, bundle, package the solution and automatically increment the version. Additionally, you can use aliases 'import { yourwebpart } from '@webparts/yourwebpart' instead of relative paths."
      )
    );
  }

  private installCustomPackages(): void {
    if (isset(this.argv.install) && this.argv.install === false) {
      return;
    }

    let packagesToInstall = CLI_Config.tryGetValue('onInitCommand.npmPackages');

    if (isNullOrEmpty(packagesToInstall)) {
      return;
    }

    const supportedPackageManager: string[] = ['npm', 'pnpm', 'yarn'];
    let packageManager = this.argv.pm;

    if (
      isNullOrEmpty(packageManager) ||
      (!isNullOrEmpty(packageManager) &&
        !supportedPackageManager.Contains((mgr) => mgr == packageManager))
    ) {
      packageManager = CLI_Config.tryGetValue('packageManager');
    }

    if (!supportedPackageManager.Contains((mgr) => mgr == packageManager)) {
      packageManager = 'npm';
    }

    try {
      if (typeof packagesToInstall === 'string') {
        packagesToInstall = JSON.parse(packagesToInstall);
      }

      (packagesToInstall as string[]).forEach((packageName: string) => {
        try {
          console.info(
            chalk.blue(`\u24D8 Try installing npm package ${packageName}...`)
          );

          console.log(`Installing ${packageName}...`);
          execSync(`${packageManager} install ${packageName}`, {
            stdio: 'inherit',
          });
          console.log(
            chalk.green(`\u2713 ${packageName} installed successfully.`)
          );
        } catch (error) {
          console.error(chalk.red(`Error installing ${packageName}: ${error}`));
        }
      });
    } catch (error) {
      console.error(
        chalk.red(
          `Error parsing config value ${packagesToInstall}. It Should be an array of string values: ${error}`
        )
      );
    }
  }

  private copyFileSync(source: string, target: string): void {
    let targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
      }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
  }

  private getTemplatesFile(fileName: string) {
    const basePath = 'templates/copy/';

    //return path.join(__dirname, '..', basePath + fileName);
    return path.join(__dirname, '../../', basePath + fileName);
  }
}
