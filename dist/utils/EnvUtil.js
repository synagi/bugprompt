class EnvironmentUtils {
    static isNodeEnvironment() {
        return (typeof process !== "undefined" &&
            process.versions != null &&
            process.versions.node != null);
    }
}
export default EnvironmentUtils;
//# sourceMappingURL=EnvUtil.js.map