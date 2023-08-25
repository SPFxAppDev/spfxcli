export const disableWarningsCommandDefinition = (build: any): void => {
  // Retrieve the current build config and check if there is a `warnoff` flag set
  const currentConfig = build.getConfig();
  const warningLevel = currentConfig.args['warnoff'];

  // Extend the SPFx build rig, and overwrite the `shouldWarningsFailBuild` property
  if (!warningLevel) {
    return;
  }

  build.log('\x1b[33m IMPORTANT: Warnings will not fail the build. \x1b[0m');
  build.addSuppression(/Warning/gi);
};
