class EnvironmentUtils {
  static isNodeEnvironment(): boolean {
    return (
      typeof process !== "undefined" &&
      process.versions != null &&
      process.versions.node != null
    );
  }
}

export default EnvironmentUtils;
