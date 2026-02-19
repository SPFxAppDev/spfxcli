/* CUSTOM ALIAS */
const path = require('path');
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

export function resolveCustomAlias(build: any): any {
  build.configureWebpack.mergeConfig({
    additionalConfiguration: (generatedConfiguration: any) => {
      if (!generatedConfiguration.resolve.alias) {
        generatedConfiguration.resolve.alias = {};
      }

      // webparts folder
      generatedConfiguration.resolve.alias['@webparts'] = path.resolve(
        __dirname,
        '..',
        'lib/webparts'
      );

      // components folder
      generatedConfiguration.resolve.alias['@components'] = path.resolve(
        __dirname,
        '..',
        'lib/components'
      );

      //root src folder
      generatedConfiguration.resolve.alias['@src'] = path.resolve(
        __dirname,
        '..',
        'lib'
      );

      return generatedConfiguration;
    },
  });
}

/* CUSTOM ALIAS END */
