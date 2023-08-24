export const disableWarningsCommandDefinition = (build: any): void => {
  // Retrieve the current build config and check if there is a `warnoff` flag set
  const currentConfig = build.getConfig();
  const warningLevel = currentConfig.args['warnoff'];

  // Extend the SPFx build rig, and overwrite the `shouldWarningsFailBuild` property
  if (!warningLevel) {
    return;
  }

  const spWebBuildRig = new build.SPWebBuildRig();
  const originalSetupSharedConfig = spWebBuildRig.setupSharedConfig;

  Object.defineProperty(build.SPWebBuildRig.prototype, 'setupSharedConfig', {
    value: function (this: any): void {
      build.log('IMPORTANT: Warnings will not fail the build.');
      build.mergeConfig({
        shouldWarningsFailBuild: false,
      });

      originalSetupSharedConfig.apply(this);
    },
  });

  build.rig = spWebBuildRig;
};
