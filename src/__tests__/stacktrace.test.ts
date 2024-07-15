import bugprompt from "../index.js";
//import { ErrorGenerator } from "../utils/TestUtil.js";
import { StackEntry, ErrorObject } from "../utils/ErrorUtil.js";
import { runSetup } from "../jest.setup.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ProjectUtil from "../utils/ProjectUtil.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("StackTracer error handling", () => {
  let testDataSnapshot: Record<string, ErrorObject>;
  let preGeneratedTestData: Record<string, ErrorObject>;

  beforeAll(async () => {
    bugprompt.config.stacktrace.enabled = true;
    bugprompt.config.log.enabled = true;

    const configPath = path.join(process.cwd(), "bugprompt.json");
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    await runSetup();
    bugprompt.enable();

    testDataSnapshot = JSON.parse(JSON.stringify(global.testData));

    const preGeneratedDataPath = path.join(
      __dirname,
      "bugprompt.test.data.json",
    );
    preGeneratedTestData = JSON.parse(
      fs.readFileSync(preGeneratedDataPath, "utf-8"),
    );

    console.log(
      "Test Data Snapshot:",
      JSON.stringify(ProjectUtil.trim(testDataSnapshot), null, 2),
    );
    console.log(
      "Pre-generated Test Data:",
      JSON.stringify(ProjectUtil.trim(preGeneratedTestData), null, 2),
    );
  });

  it("verifies StackTracer is enabled", () => {
    console.log("StackTracer state:", bugprompt.StackTracer);
    expect(bugprompt.StackTracer).toBeDefined();
    expect(bugprompt.StackTracer?.isEnabled()).toBe(true);
  });

  it("compares live results with pre-generated data", () => {
    console.log("Comparing live results with pre-generated data");
    expect(Object.keys(testDataSnapshot)).toEqual(
      Object.keys(preGeneratedTestData),
    );

    for (const [errorType, errorData] of Object.entries(preGeneratedTestData)) {
      console.log(`Comparing ${errorType}`);
      const liveData = testDataSnapshot[errorType];
      expect(liveData).toBeDefined();
      expect(liveData.error.name).toBe(errorData.error.name);
      expect(liveData.error.message).toBe(errorData.error.message);

      if (
        Array.isArray(liveData.error.stack) &&
        Array.isArray(errorData.error.stack)
      ) {
        liveData.error.stack.forEach((entry: StackEntry, index: number) => {
          const preGenEntry = errorData.error.stack[index] as StackEntry;
          console.log(`Comparing stack entry ${index}:`);
          console.log("Live data:", entry);
          console.log("Pre-generated data:", preGenEntry);
          expect(entry.file).toBe(preGenEntry.file); // Expect exact match
          expect(typeof entry.line).toBe("number");
          expect(entry.at).toBe(preGenEntry.at);
          expect(entry.code).toBe(preGenEntry.code);
        });
      }

      console.log("Comparing formatted output");
      console.log("Live formatted:", liveData.formatted);
      console.log("Pre-generated formatted:", errorData.formatted);
      expect(liveData.formatted).toBe(errorData.formatted);
    }
  });
  /*
  it("processes errors correctly", async () => {
    console.log("Processing errors");
    const errorGen = new ErrorGenerator();

    for (const [errorType, errorData] of Object.entries(preGeneratedTestData)) {
      console.log(`Processing ${errorType}`);
      if (!(errorType in errorGen)) {
        throw new Error(
          `ErrorGenerator does not have a method for ${errorType}`,
        );
      }

      try {
        await (errorGen as any)[errorType]();
        fail(`Expected ${errorType} to throw an error, but it did not`);
      } catch (error: unknown) {
        const result = bugprompt.StackTracer?.processErrorSync(error as Error);

        expect(result).toBeDefined();
        if (result) {
          console.log("Processed error result:", result);
          expect(result.error.name).toBe(errorData.error.name);
          expect(result.error.message).toBe(errorData.error.message);

          if (
            Array.isArray(result.error.stack) &&
            Array.isArray(errorData.error.stack)
          ) {
            result.error.stack.forEach((entry: StackEntry, index: number) => {
              const testEntry = errorData.error.stack[index] as StackEntry;
              console.log(`Comparing processed stack entry ${index}:`);
              console.log("Processed data:", entry);
              console.log("Pre-generated data:", testEntry);
              expect(entry.file).toContain(path.basename(testEntry.file));
              expect(typeof entry.line).toBe("number");
              expect(entry.at).toBe(testEntry.at);
              expect(entry.code).toBe(testEntry.code);
            });
          } else {
            throw new Error(`Stack is not an array for ${errorType}`);
          }

          console.log("Comparing processed formatted output");
          console.log("Processed formatted:", result.formatted);
          console.log("Pre-generated formatted:", errorData.formatted);
          expect(result.formatted).toBe(errorData.formatted);
        }
      }
    }
  });
*/
  afterAll(() => {
    bugprompt.disable();
  });
});
