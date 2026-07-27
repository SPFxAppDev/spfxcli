import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import replace from 'replace-in-file';
import detectIndent from 'detect-indent';
import { CLI_Config } from '../../index.js';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import spfxAppDevUtility from '@spfxappdev/utility';
const { isNullOrEmpty, isset, replaceTpl } = spfxAppDevUtility;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spfxAppDevFolderName: string = '@spfxappdev';

export class InitCommandHandler {
  constructor(private readonly argv) {}

  public execute(): void {
    this.createSPFxAppDevFolder();
    this.extendHeftFile();
    this.createSPFxCustomizeWebpackFile();
    this.extendTSConfigFile();
    this.extendFastServeWebPackIfExist();
    this.extendPackageFile();
    this.extendSPFxServeFile();
    this.installCustomPackages();
  }

  private createSPFxAppDevFolder(): void {
    const spfxAppDevFolder = path.join(process.cwd(), spfxAppDevFolderName);
    const nodeModulesAppDevFolder = path.join(process.cwd(), 'node_modules', spfxAppDevFolderName, 'tasks');

    if (!fs.existsSync(spfxAppDevFolder)) {
      fs.mkdirSync(spfxAppDevFolder, { recursive: true });
    }
    if (!fs.existsSync(nodeModulesAppDevFolder)) {
      fs.mkdirSync(nodeModulesAppDevFolder, { recursive: true });
    }

    const source = this.getTemplatesFile('');

    if (!fs.existsSync(source) || !fs.lstatSync(source).isDirectory()) {
      return;
    }

    // Copy all files from templates/copy/ into process.cwd()/@spfxappdev and process.cwd()/node_modules/@spfxappdev/tasks
    let files = fs.readdirSync(source);
    files.forEach((file) => {
      var curSource = path.join(source, file);
      this.copyFileSync(curSource, spfxAppDevFolder);
      this.copyFileSync(curSource, nodeModulesAppDevFolder);
    });
  }

  private extendHeftFile(): void {
    const configFolderPath = path.join(process.cwd(), 'config');
    if (!fs.existsSync(configFolderPath)) {
      fs.mkdirSync(configFolderPath, { recursive: true });
    }

    const heftConfigPath = path.join(configFolderPath, 'heft.json');
    let heftJson: any = {};
    let indent = '  ';

    if (fs.existsSync(heftConfigPath)) {
      const heftConfigString = fs.readFileSync(heftConfigPath).toString();
      indent = detectIndent(heftConfigString).indent || '  ';
      try {
        heftJson = JSON.parse(heftConfigString);
      } catch {
        heftJson = {};
      }
    } else {
      heftJson = {
        '$schema': 'https://developer.microsoft.com/json-schemas/heft/v0/heft.schema.json',
        'extends': '@microsoft/spfx-web-build-rig/profiles/default/config/heft.json',
      };
    }

    heftJson.phasesByName = heftJson.phasesByName || {};

    // Register disable-warnings-plugin under heftPlugins
    heftJson.heftPlugins = heftJson.heftPlugins || [];
    const disableWarnPluginExists = heftJson.heftPlugins.some(
      (p: any) => p.pluginPackage === '@spfxappdev/tasks' && p.pluginName === 'disable-warnings-plugin'
    );
    if (!disableWarnPluginExists) {
      heftJson.heftPlugins.push({
        pluginPackage: '@spfxappdev/tasks',
        pluginName: 'disable-warnings-plugin',
      });
    }

    // Register bump-version phase
    heftJson.phasesByName['bump-version'] = heftJson.phasesByName['bump-version'] || {
      phaseDescription: 'Increments the solution version number',
      tasksByName: {},
    };

    heftJson.phasesByName['bump-version'].tasksByName = heftJson.phasesByName['bump-version'].tasksByName || {};
    heftJson.phasesByName['bump-version'].tasksByName['bump-version-task'] = {
      taskPlugin: {
        pluginPackage: '@spfxappdev/tasks',
        pluginName: 'bump-version-plugin',
      },
    };

    // Register bump-version-task in build phase
    heftJson.phasesByName['build'] = heftJson.phasesByName['build'] || {};
    heftJson.phasesByName['build'].tasksByName = heftJson.phasesByName['build'].tasksByName || {};
    heftJson.phasesByName['build'].tasksByName['bump-version-task'] = {
      taskPlugin: {
        pluginPackage: '@spfxappdev/tasks',
        pluginName: 'bump-version-plugin',
      },
    };

    fs.writeFileSync(heftConfigPath, JSON.stringify(heftJson, null, indent) + '\n');

    console.log(chalk.green('\u2713 config/heft.json successfully extended.'));
  }

  private createSPFxCustomizeWebpackFile(): void {
    const configFolderPath = path.join(process.cwd(), 'config');
    if (!fs.existsSync(configFolderPath)) {
      fs.mkdirSync(configFolderPath, { recursive: true });
    }

    const customizeWebpackPath = path.join(configFolderPath, 'spfx-customize-webpack.js');

    if (fs.existsSync(customizeWebpackPath)) {
      const content = fs.readFileSync(customizeWebpackPath).toString();
      if (content.indexOf('./@spfxappdev') !== -1 || content.indexOf('../@spfxappdev') !== -1) {
        console.log(
          chalk.green('\u2713 It looks like your config/spfx-customize-webpack.js was patched before, skipping.'),
        );
        return;
      }
    }

    const fileContent = `const { resolveCustomAlias } = require('../@spfxappdev');

module.exports = function (webpackConfiguration, taskSession, heftConfiguration, webpack) {
  resolveCustomAlias(webpackConfiguration);
};
`;

    fs.writeFileSync(customizeWebpackPath, fileContent);

    console.log(chalk.green('\u2713 config/spfx-customize-webpack.js successfully created/extended.'));
  }

  private extendTSConfigFile(): void {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      console.warn(chalk.yellow('\u26A0 tsconfig.json file does not exist, skipping extension.'));
      return;
    }

    const tsconfigString = fs.readFileSync(tsconfigPath).toString();
    const indent = detectIndent(tsconfigString).indent || '  ';
    const tsconfigJson = JSON.parse(tsconfigString);

    tsconfigJson.compilerOptions = tsconfigJson.compilerOptions || {};
    const compilerOptions = tsconfigJson.compilerOptions;

    if (compilerOptions.baseUrl) {
      console.warn(chalk.yellow('\u26A0 Your tsconfig.json baseUrl property will be replaced.'));
    }

    compilerOptions.paths = compilerOptions.paths || {};
    if (compilerOptions.paths['@src/*']) {
      console.warn(chalk.yellow("\u26A0 Your tsconfig.json path '@src/*' will be replaced."));
    }

    if (compilerOptions.paths['@components/*']) {
      console.warn(
        chalk.yellow("\u26A0 Your tsconfig.json path '@components/*' will be replaced."),
      );
    }

    if (compilerOptions.paths['@webparts/*']) {
      console.warn(chalk.yellow("\u26A0 Your tsconfig.json path '@webparts/*' will be replaced."));
    }

    compilerOptions.baseUrl = '.';
    compilerOptions.paths['@src/*'] = ['src/*'];
    compilerOptions.paths['@components/*'] = ['src/components/*'];
    compilerOptions.paths['@webparts/*'] = ['src/webparts/*'];

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigJson, null, indent) + '\n');

    console.log(chalk.green('\u2713 tsconfig.json successfully extended.'));
  }

  private extendFastServeWebPackIfExist(): void {
    const webpackPath = path.join(process.cwd(), 'fast-serve/webpack.extend.js');

    if (!fs.existsSync(webpackPath)) {
      console.log(
        chalk.green('\u2713 It looks like you have not installed spfx-fast-serve, skipping.'),
      );
      return;
    }

    const webpackExtendString = fs.readFileSync(webpackPath).toString();

    if (webpackExtendString.indexOf('alias:') !== -1) {
      console.log(
        chalk.green(
          '\u2713 It looks like your fast-serve/webpack.extend.js was patched before, skipping.',
        ),
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

    console.log(chalk.green('\u2713 fast-serve/webpack.extend.js successfully extended.'));
  }

  private extendPackageFile(): void {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.warn(chalk.yellow('\u26A0 package.json file does not exist, skipping extension.'));
      return;
    }

    const packageString = fs.readFileSync(packagePath).toString();
    const indent = detectIndent(packageString).indent || '  ';
    const packageJson = JSON.parse(packageString);

    packageJson.scripts = packageJson.scripts || {};
    if (packageJson.scripts['publish']) {
      console.warn(chalk.yellow("\u26A0 Your npm 'publish' command will be replaced."));
    }

    if (packageJson.scripts['postpublish']) {
      console.warn(chalk.yellow("\u26A0 Your npm 'postpublish' command will be replaced."));
    }

    if (packageJson.scripts['publish:nowarn']) {
      console.warn(chalk.yellow("\u26A0 Your npm 'publish:nowarn' command will be replaced."));
    }

    packageJson.scripts['publish:nowarn'] = 'npm run publish -- --warnoff';
    packageJson.scripts['publish'] = 'heft clean && heft build --production';
    packageJson.scripts['postpublish'] = 'heft package-solution --production';

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, indent) + '\n');

    console.log(
      chalk.green(
        "\u2713 You can now use 'npm run publish' to build, bundle, package the solution and automatically increment the version. Additionally, you can use aliases 'import { yourwebpart } from '@webparts/yourwebpart' instead of relative paths.",
      ),
    );
  }

  private extendSPFxServeFile(): void {
    const siteUrl = CLI_Config.tryGetValue('sharepoint.siteurl', true);

    if (isNullOrEmpty(siteUrl)) {
      return;
    }

    const servePath = path.join(process.cwd(), 'config/serve.json');
    if (!fs.existsSync(servePath)) {
      return;
    }

    const serveConfigString = fs.readFileSync(servePath).toString();
    const indent = detectIndent(serveConfigString).indent || '  ';
    const serveJson = JSON.parse(serveConfigString);

    if (!(serveJson.initialPage as string).Contains('{tenantDomain}', true)) {
      return;
    }

    serveJson.initialPage = replaceTpl(serveJson.initialPage, {
      tenantDomain: siteUrl.replace('https://', ''),
    });

    fs.writeFileSync(servePath, JSON.stringify(serveJson, null, indent) + '\n');

    console.log(chalk.green('\u2713 config/serve.json successfully extended.'));
  }

  private installCustomPackages(): void {
    if (isset(this.argv.install) && this.argv.install === false) {
      return;
    }

    let packagesToInstall = CLI_Config.tryGetValue('onInitCommand.npmPackages', true);

    if (isNullOrEmpty(packagesToInstall)) {
      console.info(
        chalk.blue(
          `\u24D8 No custom npm packages are defined to install, installation of additional npm packages is skipped...`,
        ),
      );
      return;
    }

    const supportedPackageManager: string[] = ['npm', 'pnpm', 'yarn'];
    let packageManager = this.argv.pm;

    if (
      isNullOrEmpty(packageManager) ||
      (!isNullOrEmpty(packageManager) &&
        !supportedPackageManager.Contains((mgr) => mgr == packageManager))
    ) {
      packageManager = CLI_Config.tryGetValue('packageManager', true);
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
          console.info(chalk.blue(`\u24D8 Try installing npm package ${packageName}...`));

          const installCommand = packageManager === 'npm' ? 'install' : 'add';

          execSync(`${packageManager} ${installCommand} ${packageName}`, {
            stdio: 'inherit',
          });
          console.log(chalk.green(`\u2713 ${packageName} installed successfully.`));
        } catch (error) {
          console.error(chalk.red(`Error installing ${packageName}: ${error}`));
        }
      });
    } catch (error) {
      console.error(
        chalk.red(
          `Error parsing config value ${packagesToInstall}. It Should be an array of string values: ${error}`,
        ),
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
    return path.join(__dirname, '../../', basePath + fileName);
  }
}
