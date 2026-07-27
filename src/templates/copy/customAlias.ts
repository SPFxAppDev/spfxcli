/* CUSTOM ALIAS */
import * as path from 'path';

export function resolveCustomAlias(webpackConfiguration: any): any {
  if (!webpackConfiguration) {
    return webpackConfiguration;
  }
  if (!webpackConfiguration.resolve) {
    webpackConfiguration.resolve = {};
  }
  if (!webpackConfiguration.resolve.alias) {
    webpackConfiguration.resolve.alias = {};
  }

  // webparts folder
  webpackConfiguration.resolve.alias['@webparts'] = path.resolve(
    __dirname,
    '..',
    'lib/webparts'
  );

  // components folder
  webpackConfiguration.resolve.alias['@components'] = path.resolve(
    __dirname,
    '..',
    'lib/components'
  );

  // root src folder
  webpackConfiguration.resolve.alias['@src'] = path.resolve(
    __dirname,
    '..',
    'lib'
  );

  return webpackConfiguration;
}

/* CUSTOM ALIAS END */
