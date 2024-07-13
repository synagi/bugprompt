import bugprompt from "./dist/index.js";

// Configure bugprompt
bugprompt.config();

// Test logging
console.log("Testing bugprompt logging:");
bugprompt.LoggerWrapper.info("This is an info message");
bugprompt.LoggerWrapper.warn("This is a warning message");
bugprompt.LoggerWrapper.error("This is an error message");

// Test synchronous error
console.log("\nGenerating a synchronous error to test stack trace:");
function generateSyncError() {
  throw new Error("Test synchronous error for stack trace");
}

try {
  generateSyncError();
} catch (error) {
  console.error(
    "Caught synchronous error:",
    bugprompt.StackTracer.processErrorSync(error).formatted,
  );
}

// Test asynchronous error
console.log("\nGenerating an asynchronous error to test stack trace:");
async function generateAsyncError() {
  throw new Error("Test asynchronous error for stack trace");
}

generateAsyncError().catch(async (error) => {
  const processedError = await bugprompt.StackTracer.processError(error);
  console.error("Caught asynchronous error:", processedError.formatted);
});

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
