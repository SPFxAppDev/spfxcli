#!/usr/bin/env node
const pkg = require('./../package.json');
import * as fs from 'fs';
import * as path from 'path';
import detectIndent from 'detect-indent';
import * as logSymbols from 'log-symbols';
import replace from 'replace-in-file';

const spfxAppDevFolderName: string = "@spfxappdev";

export function getTemplatesPath(fileName: string) {
    const basePath = 'templates/';
  
    //return path.join(__dirname, '..', basePath + fileName);
    return path.join(__dirname, basePath + fileName);
}

const copyFileSync = ( source: string, target: string ) => {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

const createSPFxAppDevFolder = () => {
    const spfxAppDevFolder = path.join(process.cwd(), spfxAppDevFolderName);

    if (!fs.existsSync(spfxAppDevFolder)) {
        fs.mkdirSync(spfxAppDevFolder);
    }

    const source = getTemplatesPath("");

    // Copy
    if (fs.lstatSync( source ).isDirectory() ) {
        let files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            // if ( fs.lstatSync( curSource ).isDirectory() ) {
            //     copyFolderRecursiveSync( curSource, targetFolder );
            // } else {
                copyFileSync( curSource, spfxAppDevFolder );
            // }
        } );
    }

};

const extendGulpFile = () => {
    const gulpfilePath = path.join(process.cwd(), 'gulpfile.js');
    const gulpfileString = fs.readFileSync(gulpfilePath).toString();

    if (gulpfileString.indexOf('./@spfxappdev') !== -1) {
        console.log(logSymbols.success, 'It looks like your gulpfile.js was patched before, skipping.');
        return;
    }

    const options = {
        files: gulpfilePath,
        from: /build\.initialize.*;/g,
        to: `
/* CUSTOM ALIAS AND VERSION BUMP START */
const { resolveCustomAlias, registerBumbVersionTask } = require('./@spfxappdev');
resolveCustomAlias(build);
registerBumbVersionTask(build);
/* CUSTOM ALIAS AND VERSION BUMP END */

build.initialize(require('gulp'));
        `,
      };
  
      replace.sync(options);
  
      console.log(logSymbols.success, 'gulpfile.js successfully extended.');
};

const extendTSConfigFile = () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const tsconfigString = fs.readFileSync(tsconfigPath).toString();
    const indent = detectIndent(tsconfigString).indent || '  ';
    const tsconfigJson = JSON.parse(tsconfigString);

    

    if (tsconfigJson.baseUrl) {
        console.warn(logSymbols.warning, "Your tsconfig.json baseUrl  property will be replaced.");
    }

    tsconfigJson.paths = tsconfigJson.paths || {};
    if (tsconfigJson.paths['@src/*']) {
      console.warn(logSymbols.warning, "Your tsconfig.json path  \'@src/*\' will be replaced.");
    }

    if (tsconfigJson.paths['@components/*']) {
        console.warn(logSymbols.warning, "Your tsconfig.json path  \'@components/*\' will be replaced.");
    }

    if (tsconfigJson.paths['@webparts/*']) {
        console.warn(logSymbols.warning, "Your tsconfig.json path  \'@webparts/*\' will be replaced.");
    }

    tsconfigJson.baseUrl = ".";
    tsconfigJson.paths['@src/*'] = ["src/*"];
    tsconfigJson.paths['@components/*'] = ["src/components/*"];
    tsconfigJson.paths['@webparts/*'] = ["src/webparts/*"];

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigJson, null, indent));
}

const extendFastServeWebPackIfExist = () => {
    const webpackPath = path.join(process.cwd(), 'fast-serve/webpack.extend.js');

    if (!fs.existsSync(webpackPath)) {
        console.log(logSymbols.success, 'It looks like you have not installed spfx-fast-serve, skipping.');
        return;
    }

    const webpackExtendString = fs.readFileSync(webpackPath).toString();

    if (webpackExtendString.indexOf('alias:') !== -1) {
        console.log(logSymbols.success, 'It looks like your fast-serve/webpack.extend.js was patched before, skipping.');
        return;
    }
    
    const options = {
        files: webpackPath,
        from: /const webpackConfig.*\{/g,
        to: `

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
  
      console.log(logSymbols.success, 'fast-serve/webpack.extend.js successfully extended.');
}

const extendPackageFile = () => {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageString = fs.readFileSync(packagePath).toString();
    const indent = detectIndent(packageString).indent || '  ';
    const packageJson = JSON.parse(packageString);

    packageJson.scripts = packageJson.scripts || {};
    if (packageJson.scripts['publish']) {
      console.warn(logSymbols.warning, "Your npm \'publish\' command will be replaced.");
    }

    if (packageJson.scripts['postpublish']) {
        console.warn(logSymbols.warning, "Your npm \'postpublish\' command will be replaced.");
    }

    packageJson.scripts['publish'] = 'gulp clean && gulp build && gulp bundle --ship';
    packageJson.scripts['postpublish'] = 'gulp package-solution --ship';

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, indent));

    console.log(logSymbols.success, "You can now use 'npm run publish' to build, bundle, package the solution and automatically increment the version. Additionally, you can use aliases 'import { yourwebpart } from '@webparts/yourwebpart' instead of relative paths.");
};



createSPFxAppDevFolder();
extendGulpFile();
extendTSConfigFile();
extendFastServeWebPackIfExist();
extendPackageFile();