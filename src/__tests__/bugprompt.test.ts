import bugprompt from "../index.js";
import fs from "fs";
import path from "path";
import { jest } from "@jest/globals";

import { DEFAULT_CONFIG } from "../config/Config.default.js";
import { BugpromptConfig } from "../config/Config.js";

const configPath = path.join(process.cwd(), "bugprompt.json");
const logPath = path.join(process.cwd(), "bugprompt.log");

function isConfigEqualToDefault(config: BugpromptConfig): boolean {
  function compareObjects(obj1: any, obj2: any): boolean {
    if (typeof obj1 !== typeof obj2) return false;
    if (typeof obj1 !== "object" || obj1 === null) return obj1 === obj2;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!compareObjects(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  return compareObjects(config, DEFAULT_CONFIG);
}

describe("Bugprompt Tests", () => {
  beforeEach(() => {
    // Clear config file
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    // Clear log file
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
    bugprompt.disable();
    jest.resetAllMocks();
  });

  afterEach(() => {
    // Clean up config file
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    // Clean up log file
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }
  });

  test("Bugprompt initializes with default config when bugprompt.json is missing", () => {
    expect(fs.existsSync(configPath)).toBe(false);

    bugprompt.enable();

    expect(fs.existsSync(configPath)).toBe(true);

    const configContent: BugpromptConfig = JSON.parse(
      fs.readFileSync(configPath, "utf8"),
    );
    expect(isConfigEqualToDefault(configContent)).toBe(true);

    expect(isConfigEqualToDefault(bugprompt.config)).toBe(true);
  });

  test("Bugprompt reads config from bugprompt.json", () => {
    const testConfig: BugpromptConfig = {
      ...DEFAULT_CONFIG,
      stacktrace: {
        ...DEFAULT_CONFIG.stacktrace,
        enabled: !DEFAULT_CONFIG.stacktrace?.enabled,
      },
      log: {
        ...DEFAULT_CONFIG.log,
        enabled: !DEFAULT_CONFIG.log?.enabled,
      },
    };

    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    expect(bugprompt.config.stacktrace?.enabled).toBe(
      !DEFAULT_CONFIG.stacktrace?.enabled,
    );
    expect(bugprompt.config.log?.enabled).toBe(!DEFAULT_CONFIG.log?.enabled);

    // Check that other properties remain unchanged
    const { stacktrace, log, ...restConfig } = bugprompt.config;
    const {
      stacktrace: defaultStacktrace,
      log: defaultLog,
      ...restDefaultConfig
    } = DEFAULT_CONFIG;
    expect(restConfig).toEqual(restDefaultConfig);
  });

  test("Logger does not log when disabled in config", () => {
    const testConfig: BugpromptConfig = {
      ...DEFAULT_CONFIG,
      log: {
        ...DEFAULT_CONFIG.log,
        enabled: false,
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    const consoleSpy = jest.spyOn(console, "log");
    bugprompt.LoggerWrapper?.info("Test console message");

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(logPath)).toBe(false);

    consoleSpy.mockRestore();
  });

  test("Logger logs to console and file when enabled in config", () => {
    const testConfig: BugpromptConfig = {
      ...DEFAULT_CONFIG,
      log: {
        ...DEFAULT_CONFIG.log,
        enabled: true,
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    const consoleSpy = jest.spyOn(console, "log");
    bugprompt.LoggerWrapper?.info("Test message");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] Test message"),
    );

    // Wait for a short time to allow for file writing
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(fs.existsSync(logPath)).toBe(true);
        const logContent = fs.readFileSync(logPath, "utf8");
        expect(logContent).toContain("[INFO] Test message");
        consoleSpy.mockRestore();
        resolve();
      }, 100);
    });
  });

  test("StackTracer is disabled when config.stacktrace.enabled is false", () => {
    const testConfig: BugpromptConfig = {
      ...DEFAULT_CONFIG,
      stacktrace: {
        ...DEFAULT_CONFIG.stacktrace,
        enabled: false,
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    const error = new Error("Test error");
    const result = bugprompt.StackTracer?.processErrorSync(error);

    expect(result).toBeUndefined();
  });

  test("StackTracer is enabled when config.stacktrace.enabled is true", () => {
    const testConfig: BugpromptConfig = {
      ...DEFAULT_CONFIG,
      stacktrace: {
        ...DEFAULT_CONFIG.stacktrace,
        enabled: true,
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    const error = new Error("Test error");
    const result = bugprompt.StackTracer?.processErrorSync(error);

    expect(result).toBeDefined();
    expect(result?.error.message).toBe("Test error");
    expect(result?.formatted).toContain("Test error");
  });

  test("Bugprompt can be enabled and disabled multiple times", () => {
    const testConfig: BugpromptConfig = {
      ...DEFAULT_CONFIG,
      log: {
        ...DEFAULT_CONFIG.log,
        enabled: true,
      },
      stacktrace: {
        ...DEFAULT_CONFIG.stacktrace,
        enabled: true,
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    // First enable
    bugprompt.enable();

    const consoleSpy = jest.spyOn(console, "log");

    // Check if logger is working
    bugprompt.LoggerWrapper?.info("Test message 1");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] Test message 1"),
    );

    // Check if StackTracer is working
    const error1 = new Error("Test error 1");
    const result1 = bugprompt.StackTracer?.processErrorSync(error1);
    expect(result1).toBeDefined();

    // Disable
    bugprompt.disable();

    // Check if logger is not working
    bugprompt.LoggerWrapper?.info("Test message 2");
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("[INFO] Test message 2"),
    );

    // Check if StackTracer is not working
    const error2 = new Error("Test error 2");
    const result2 = bugprompt.StackTracer?.processErrorSync(error2);
    expect(result2).toBeUndefined();

    // Enable again
    bugprompt.enable();

    // Check if logger is working again
    bugprompt.LoggerWrapper?.info("Test message 3");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] Test message 3"),
    );

    // Check if StackTracer is working again
    const error3 = new Error("Test error 3");
    const result3 = bugprompt.StackTracer?.processErrorSync(error3);
    expect(result3).toBeDefined();

    consoleSpy.mockRestore();
  });

  test("StackTracer handles synchronous errors", () => {
    const testConfig = {
      stacktrace: { enabled: true },
      log: { enabled: false },
      docs: {
        /* ... */
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    const error = new Error("Test synchronous error");
    const result = bugprompt.StackTracer?.processErrorSync(error);

    expect(result?.error.message).toBe("Test synchronous error");
    expect(result?.formatted).toContain("Test synchronous error");
  });

  test("StackTracer handles asynchronous errors", async () => {
    const testConfig = {
      stacktrace: { enabled: true },
      log: { enabled: false },
      docs: {
        /* ... */
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    const error = new Error("Test asynchronous error");
    const result = await bugprompt.StackTracer?.processError(error);

    expect(result?.error.message).toBe("Test asynchronous error");
    expect(result?.formatted).toContain("Test asynchronous error");
  });

  test("StackTracer handles rejected promises", async () => {
    const testConfig: BugpromptConfig = {
      ...DEFAULT_CONFIG,
      stacktrace: { enabled: true },
      log: { enabled: true },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.enable();

    const rejectedPromise = Promise.reject(new Error("Test rejected promise"));

    await expect(rejectedPromise).rejects.toThrow("Test rejected promise");

    // Use a try-catch block to capture the error
    try {
      await rejectedPromise;
    } catch (error) {
      if (error instanceof Error) {
        const stackTracerResult =
          bugprompt.StackTracer?.processErrorSync(error);
        expect(stackTracerResult).toBeDefined();
        expect(stackTracerResult?.error.message).toBe("Test rejected promise");
        expect(stackTracerResult?.formatted).toContain("Test rejected promise");
      } else {
        throw new Error("Caught error is not an instance of Error");
      }
    }
  });
});
