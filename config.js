
exports.Config = {
  reactPath: "./reactBuild", //path to the react build files

  name: "", //name theme, also used as folder name (so no spaces and special characters)
  version: "0.0.1", //theme won't update if version number isn't changed
  themeUri: "",
  author: "",
  authorUrl: "",
  description: "",

  includeUpdater: "false", //gitlab updater code
  gitLabRepoUrl: "",
  updaterKey: "",
  gitLabBranchToWatch: "" //branch for updater to get updated from
};

//export default Config;
