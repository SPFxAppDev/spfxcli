import * as fs from 'fs';
import * as path from 'path';
import { disableWarningsCommandDefinition } from './disableWarnings.js';

export interface IHeftTaskSession {
  logger: {
    terminal: {
      writeLine(message: string): void;
      writeWarningLine(message: string): void;
    };
  };
  hooks: {
    run: {
      tapPromise(pluginName: string, callback: () => Promise<void>): void;
    };
  };
}

export interface HeftConfiguration {
  buildFolderPath: string;
}

export interface IHeftTaskPlugin {
  apply(taskSession: IHeftTaskSession, heftConfiguration: HeftConfiguration): void;
}

const getJson = (file: string): any => {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

export default class BumpVersionPlugin implements IHeftTaskPlugin {
  public apply(taskSession: IHeftTaskSession, heftConfiguration: HeftConfiguration): void {
    disableWarningsCommandDefinition();

    taskSession.hooks.run.tapPromise('bump-version-plugin', async () => {
      const logger = taskSession.logger;
      const argv = process.argv;
      const argsString = argv.join(' ').toLowerCase();

      const isBumpVersionCommand = argsString.includes('bump-version');
      const isProduction = argsString.includes('--production') || argsString.includes('--ship');

      if (!isBumpVersionCommand && !isProduction) {
        logger.terminal.writeLine(
          "The current command is not 'bump-version' or the --production/--ship argument was not specified, skip version bump"
        );
        return;
      }

      const explicitFalseMajor = argv.some((arg) => arg === '--major=false' || arg === '--no-major');
      const explicitFalseMinor = argv.some((arg) => arg === '--minor=false' || arg === '--no-minor');
      const explicitFalsePatch = argv.some((arg) => arg === '--patch=false' || arg === '--no-patch');

      const hasMajor = argv.some((arg) => arg === '--major' || arg.startsWith('--major=true'));
      const hasMinor = argv.some((arg) => arg === '--minor' || arg.startsWith('--minor=true'));
      const hasPatch = argv.some((arg) => arg === '--patch' || arg.startsWith('--patch=true'));

      const skipMajorVersion = explicitFalseMajor || !hasMajor;
      const skipMinorVersion = explicitFalseMinor || (!skipMajorVersion ? true : !hasMinor);
      const skipPatchVersion = explicitFalsePatch || (!skipMajorVersion || !skipMinorVersion ? true : !hasPatch);

      let bumpMajor = !skipMajorVersion;
      let bumpMinor = skipMajorVersion && !skipMinorVersion;
      let bumpPatch = skipMajorVersion && skipMinorVersion && !skipPatchVersion;

      if (!hasMajor && !hasMinor && !hasPatch) {
        bumpMajor = false;
        bumpMinor = false;
        bumpPatch = !explicitFalsePatch;
      }

      if (!bumpMajor && !bumpMinor && !bumpPatch) {
        logger.terminal.writeLine(
          "skip version bump, because all specified arguments (major, minor, patch) are set to 'false'"
        );
        return;
      }

      const pkgSolutionPath = path.resolve(heftConfiguration.buildFolderPath, 'config/package-solution.json');
      if (!fs.existsSync(pkgSolutionPath)) {
        logger.terminal.writeWarningLine(`File not found: ${pkgSolutionPath}`);
        return;
      }

      const pkgSolutionJson = getJson(pkgSolutionPath);
      const currentVersionNumber = String(pkgSolutionJson.solution.version || '1.0.0.0');
      let nextVersionSplitted: number[] = currentVersionNumber.split('.').map((v) => parseInt(v, 10) || 0);
      while (nextVersionSplitted.length < 4) {
        nextVersionSplitted.push(0);
      }

      logger.terminal.writeLine(`Current version: ${currentVersionNumber}`);

      if (bumpMajor) {
        nextVersionSplitted[0] = (nextVersionSplitted[0] || 0) + 1;
        nextVersionSplitted[1] = 0;
        nextVersionSplitted[2] = 0;
        nextVersionSplitted[3] = 0;
      } else if (bumpMinor) {
        nextVersionSplitted[1] = (nextVersionSplitted[1] || 0) + 1;
        nextVersionSplitted[2] = 0;
        nextVersionSplitted[3] = 0;
      } else if (bumpPatch) {
        nextVersionSplitted[2] = (nextVersionSplitted[2] || 0) + 1;
        nextVersionSplitted[3] = 0;
      }

      const nextVersionNumber = nextVersionSplitted.join('.');
      logger.terminal.writeLine(`New version: ${nextVersionNumber}`);

      pkgSolutionJson.solution.version = nextVersionNumber;
      fs.writeFileSync(pkgSolutionPath, JSON.stringify(pkgSolutionJson, null, 2) + '\n');

      const pkgJsonPath = path.resolve(heftConfiguration.buildFolderPath, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const packageJson = getJson(pkgJsonPath);
        packageJson.version = nextVersionSplitted.slice(0, 3).join('.');
        fs.writeFileSync(pkgJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      }
    });
  }
}
