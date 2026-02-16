const gulp = require('gulp');
const gulpLog = require('fancy-log');
const through2 = require('through2');

const fs = require('fs');

const getJson = (file: string): any => {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

export const registerBumbVersionTask = (build: any): void => {
  let bumpVersionSubTask = build.subTask(
    'bump-version-subtask',
    function (gulp: any, buildOptions: any, done: any) {
      const currentCommand = buildOptions.args._[0];

      const skipFunc = gulp.src('./config/package-solution.json').pipe(through2.obj());

      if (typeof currentCommand != 'string') {
        gulpLog('The current command is undefined, skip version bump');
        return skipFunc;
      }

      const commandName = currentCommand.toLocaleLowerCase();

      if (commandName != 'bundle' && commandName != 'bump-version') {
        gulpLog("The current command is not 'bundle' or 'bump-version', skip version bump");
        return skipFunc;
      }

      const bumpVersion = commandName == 'bump-version' || buildOptions.args['ship'] === true;

      if (!bumpVersion) {
        gulpLog(
          "The current command is not 'bump-version' or the --ship argument was not specified, skip version bump",
        );
        return skipFunc;
      }

      const a = buildOptions.args;

      const skipMajorVersion = typeof a['major'] == 'undefined' || a['major'] === false;
      const skipMinorVersion =
        !skipMajorVersion || typeof a['minor'] == 'undefined' || a['minor'] === false;
      const skipPatchVersion = !skipMajorVersion || !skipMinorVersion || a['patch'] === false;

      if (skipMajorVersion && skipMinorVersion && skipPatchVersion) {
        gulpLog(
          "skip version bump, because all specified arguments (major, minor, patch) are set to 'false'",
        );
        return skipFunc;
      }

      const pkgSolutionJson = getJson('./config/package-solution.json');
      const currentVersionNumber = String(pkgSolutionJson.solution.version);
      let nextVersionNumber = currentVersionNumber.slice();
      let nextVersionSplitted: any[] = nextVersionNumber.split('.');
      gulpLog('Current version: ' + currentVersionNumber);

      if (!skipMajorVersion) {
        nextVersionSplitted[0] = parseInt(nextVersionSplitted[0]) + 1;
        nextVersionSplitted[1] = 0;
        nextVersionSplitted[2] = 0;
        nextVersionSplitted[3] = 0;
      }

      if (!skipMinorVersion) {
        nextVersionSplitted[1] = parseInt(nextVersionSplitted[1]) + 1;
        nextVersionSplitted[2] = 0;
        nextVersionSplitted[3] = 0;
      }

      if (!skipPatchVersion) {
        nextVersionSplitted[2] = parseInt(nextVersionSplitted[2]) + 1;
        nextVersionSplitted[3] = 0;
      }

      nextVersionNumber = nextVersionSplitted.join('.');

      gulpLog('New version: ', nextVersionNumber);

      pkgSolutionJson.solution.version = nextVersionNumber;
      fs.writeFile(
        './config/package-solution.json',
        JSON.stringify(pkgSolutionJson, null, 4),
        () => {},
      );

      const packageJson = getJson('./package.json');
      packageJson.version = nextVersionNumber.split('.').splice(0, 3).join('.');
      fs.writeFile('./package.json', JSON.stringify(packageJson, null, 4), () => {});

      return gulp.src('./config/package-solution.json').pipe(gulp.dest('./config'));
    },
  );

  let bumpVersionTask = build.task('bump-version', bumpVersionSubTask);
  build.rig.addPreBuildTask(bumpVersionTask);
};
