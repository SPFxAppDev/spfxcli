export const disableWarnings = (build: any): void => {
  // Retrieve the current build config and check if there is a `warnoff` flag set
  const currentConfig = build.getConfig();
  const warningLevel = currentConfig.args['warnoff'];

  // Extend the SPFx build rig, and overwrite the `shouldWarningsFailBuild` property
  if (!warningLevel) {
    return;
  }

  class CustomSPWebBuildRig extends build.SPWebBuildRig {
    setupSharedConfig() {
      build.log('IMPORTANT: Warnings will not fail the build.');
      build.mergeConfig({
        shouldWarningsFailBuild: false,
      });
      super.setupSharedConfig();
    }
  }

  build.rig = new CustomSPWebBuildRig();
};
