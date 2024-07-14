// test.js
import bugprompt from "./dist/index.js";

console.log("Bugprompt instance:", bugprompt);

// Configure bugprompt
bugprompt.config();

// Test logging
console.log("Testing bugprompt logging:");
if (bugprompt.Wrapper) {
  bugprompt.Wrapper.info("This is an info message");
  bugprompt.Wrapper.warn("This is a warning message");
  bugprompt.Wrapper.error("This is an error message");
} else {
  console.log(" is not enabled");
}

// Test synchronous error
console.log("\nGenerating a synchronous error to test stack trace:");
function generateSyncError() {
  throw new Error("Test synchronous error for stack trace");
}

generateSyncError();

// Test asynchronous error
console.log("\nGenerating an asynchronous error to test stack trace:");
async function generateAsyncError() {
  throw new Error("Test asynchronous error for stack trace");
}

generateAsyncError();

// Generate an unhandled promise rejection
console.log("\nGenerating an unhandled promise rejection:");
new Promise((resolve, reject) => {
  reject(new Error("Unhandled promise rejection"));
});

// Test error thrown in setTimeout
console.log("\nGenerating an error in setTimeout:");
setTimeout(() => {
  throw new Error("Error in setTimeout");
}, 100);

// Keep the process alive for a moment to allow for unhandled rejection and setTimeout error to be processed
setTimeout(() => {
  console.log("\nTest complete. Check your log file for results.");
  process.exit(0);
}, 1000);
