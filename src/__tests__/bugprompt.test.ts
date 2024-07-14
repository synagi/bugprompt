import bugprompt from "../index.js";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "bugprompt.json");
let originalConfig: any;

beforeEach(() => {
  if (fs.existsSync(configPath)) {
    originalConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
});

afterEach(() => {
  if (originalConfig) {
    fs.writeFileSync(configPath, JSON.stringify(originalConfig, null, 2));
  } else if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
  bugprompt.config(); // Reset bugprompt config after each test
});

describe("Bugprompt Tests", () => {
  test("Bugprompt initializes with default config when bugprompt.json is missing", () => {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    bugprompt.config();

    expect(bugprompt["_config"].stacktrace.enabled).toBe(false);
    expect(bugprompt["_config"].log.enabled).toBe(false);
  });

  test("Bugprompt reads config from bugprompt.json", () => {
    const testConfig = {
      stacktrace: { enabled: true },
      log: { enabled: true },
      docs: {
        /* ... */
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.config();

    expect(bugprompt["_config"].stacktrace.enabled).toBe(true);
    expect(bugprompt["_config"].log.enabled).toBe(true);
  });

  test("Logger works when enabled", () => {
    const testConfig = {
      stacktrace: { enabled: false },
      log: { enabled: true },
      docs: {
        /* ... */
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.config();

    const consoleSpy = jest.spyOn(console, "log");
    bugprompt.LoggerWrapper?.info("Test info message");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] Test info message"),
    );
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

    bugprompt.config();

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

    bugprompt.config();

    const error = new Error("Test asynchronous error");
    const result = await bugprompt.StackTracer?.processError(error);

    expect(result?.error.message).toBe("Test asynchronous error");
    expect(result?.formatted).toContain("Test asynchronous error");
  });

  test("StackTracer handles unhandled promise rejections", (done) => {
    const testConfig = {
      stacktrace: { enabled: true },
      log: { enabled: true },
      docs: {
        /* ... */
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    bugprompt.config();

    const originalHandler = process.listeners("unhandledRejection").pop();

    process.removeListener("unhandledRejection", originalHandler as any);

    process.once("unhandledRejection", (reason) => {
      expect((reason as Error).message).toBe("Unhandled promise rejection");
      process.listeners("unhandledRejection").push(originalHandler as any);
      done();
    });

    new Promise((_, reject) => {
      reject(new Error("Unhandled promise rejection"));
    });
  });
});
