import { runSetup } from "./jest.setup.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ProjectUtil from "../utils/ProjectUtil.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Test Data Verification", () => {
  beforeAll(async () => {
    await runSetup();
  });

  it("has populated testData", () => {
    expect(global.testData).toBeDefined();
    expect(Object.keys(global.testData).length).toBeGreaterThan(0);
  });

  it("contains expected error types", () => {
    const expectedErrorTypes = [
      "referenceError",
      "typeError",
      "syntaxError",
      "customError",
    ];
    expectedErrorTypes.forEach((errorType) => {
      expect(global.testData).toHaveProperty(errorType);
    });
  });

  it("has correct structure for error objects", () => {
    Object.values(global.testData).forEach((errorObj) => {
      expect(errorObj).toHaveProperty("error");
      expect(errorObj).toHaveProperty("log");
      expect(errorObj).toHaveProperty("formatted");
      expect(errorObj.error).toHaveProperty("name");
      expect(errorObj.error).toHaveProperty("message");
      expect(errorObj.error).toHaveProperty("stack");
    });
  });

  it("compares generated data with pre-generated JSON data", () => {
    // Load pre-generated JSON data
    const jsonFilePath = path.join(__dirname, "bugprompt.test.data.json");

    let preGenerated;
    try {
      const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));
      preGenerated = jsonData.referenceError;
    } catch (error) {
      console.error(`Error reading or parsing JSON file: ${jsonFilePath}`);
      console.error(error instanceof Error ? error.message : String(error));
      throw new Error(
        `Failed to read pre-generated data: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Get the referenceError object from the newly generated data
    const generated = global.testData?.referenceError;

    //console.log("\nPre-generated referenceError:");
    //console.log(JSON.stringify(copyAndTrimLog(preGenerated), null, 2));

    //console.log("\nNewly generated referenceError:");
    //console.log(JSON.stringify(copyAndTrimLog(generated), null, 2));

    if (!preGenerated) {
      throw new Error("Pre-generated data is missing or invalid");
    }

    if (!generated) {
      throw new Error("Newly generated data is missing or invalid");
    }

    // Compare the objects and collect differences
    const differences = compareObjects(preGenerated, generated);

    // If there are differences, log them and fail the test
    if (Object.keys(differences).length > 0) {
      console.log(
        "\nDifferences found between pre-generated and generated data:",
      );
      console.log(JSON.stringify(ProjectUtil.trim(differences), null, 2));
      throw new Error(
        "Generated data does not match pre-generated data. See console for details.",
      );
    } else {
      console.log(
        "\nNo differences found between pre-generated and generated data.",
      );
    }
  });
});

function compareObjects(
  obj1: any,
  obj2: any,
  path: string = "",
): Record<string, { preGenerated: any; generated: any }> {
  const differences: Record<string, { preGenerated: any; generated: any }> = {};

  // Helper function to check if a value is an object
  const isObject = (value: any) =>
    typeof value === "object" && value !== null && !Array.isArray(value);

  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;

    if (!obj2.hasOwnProperty(key)) {
      differences[currentPath] = {
        preGenerated: obj1[key],
        generated: undefined,
      };
    } else if (!obj1.hasOwnProperty(key)) {
      differences[currentPath] = {
        preGenerated: undefined,
        generated: obj2[key],
      };
    } else if (isObject(obj1[key]) && isObject(obj2[key])) {
      const nestedDifferences = compareObjects(
        obj1[key],
        obj2[key],
        currentPath,
      );
      Object.assign(differences, nestedDifferences);
    } else if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences[currentPath] = {
          preGenerated: obj1[key],
          generated: obj2[key],
        };
      }
    } else if (obj1[key] !== obj2[key]) {
      differences[currentPath] = {
        preGenerated: obj1[key],
        generated: obj2[key],
      };
    }
  }

  return differences;
}
