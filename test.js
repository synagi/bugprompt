import bugprompt from "./dist/bugprompt.js";

// Configure bugprompt
bugprompt.config();

// Test logging
console.log("Testing bugprompt logging:");
bugprompt.LoggerWrapper.info("This is an info message");
bugprompt.LoggerWrapper.warn("This is a warning message");
bugprompt.LoggerWrapper.error("This is an error message");

// Generate an error to test stack trace
console.log("\nGenerating an error to test stack trace:");
function generateError() {
  throw new Error("Test error for stack trace");
}

try {
  generateError();
} catch (error) {
  console.error("Caught error:", error);
}

// Generate an unhandled promise rejection
console.log("\nGenerating an unhandled promise rejection:");
new Promise((resolve, reject) => {
  reject(new Error("Unhandled promise rejection"));
});

// Keep the process alive for a moment to allow for unhandled rejection to be processed
setTimeout(() => {
  console.log("\nTest complete. Check your log file for results.");
  process.exit(0);
}, 1000);
