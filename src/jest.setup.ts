// jest.setup.ts
import bugprompt from "./index.js";
import { generateTestCases } from "./utils/TestUtil.js";
import { ErrorObject } from "./utils/ErrorUtil.js";
import fs from "fs";
import path from "path";

declare global {
  var testData: Record<string, ErrorObject>;
}

const configPath = path.join(process.cwd(), "bugprompt.json");
const logPath = path.join(process.cwd(), "bugprompt.log");

// Clear existing config and log files
if (fs.existsSync(configPath)) {
  fs.unlinkSync(configPath);
}
if (fs.existsSync(logPath)) {
  fs.unlinkSync(logPath);
}

// Create a custom config
const testConfig = {
  stacktrace: { enabled: true },
  log: { enabled: true },
  docs: {
    // ..keep existing docs config
  },
};

// Write the custom config
fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

// Now enable Bugprompt
bugprompt.enable();

async function setupTestData() {
  try {
    //console.log("jest.setup.ts: Generating test data");
    const testData = await generateTestCases(bugprompt);
    //console.log("jest.setup.ts: Test data generated successfully");
    //console.log("jest.setup.ts: Number of test cases:",Object.keys(testData).length,);
    global.testData = testData as Record<string, ErrorObject>;
  } catch (error) {
    console.error(
      "jest.setup.ts: Error generating test data:",
      error instanceof Error ? error.message : String(error),
    );
    global.testData = {};
  }
}

// Export the setup function to be used in the test
export const runSetup = async () => {
  await setupTestData();
  console.log("jest.setup.ts: End of setup");
  console.log(
    "jest.setup.ts: Final testData state:",
    Object.keys(global.testData).length,
    "test cases generated",
  );
};

// Clean up function
afterAll(() => {
  bugprompt.disable();
});
