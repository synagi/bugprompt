import bugprompt from "./dist/index.js";

async function runTests() {
  console.log("Bugprompt instance:", bugprompt);

  // Configure bugprompt
  bugprompt.config();

  // Test logging
  console.log("Testing bugprompt logging:");
  if (bugprompt.LoggerWrapper) {
    bugprompt.LoggerWrapper.info("This is an info message");
    bugprompt.LoggerWrapper.warn("This is a warning message");
    bugprompt.LoggerWrapper.error("This is an error message");
  } else {
    console.log("Logger is not enabled");
  }

  // Test synchronous error
  console.log("\nTesting synchronous error handling:");
  try {
    throw new Error("Test synchronous error for stack trace");
  } catch (error) {
    console.log("Caught synchronous error:", error.message);
  }

  // Test asynchronous error
  console.log("\nTesting asynchronous error handling:");
  try {
    await new Promise((_, reject) =>
      reject(new Error("Test asynchronous error for stack trace")),
    );
  } catch (error) {
    console.log("Caught asynchronous error:", error.message);
  }

  // Test unhandled promise rejection
  console.log("\nTesting unhandled promise rejection:");
  const unhandledRejection = new Promise((_, reject) => {
    reject(new Error("Unhandled promise rejection"));
  });

  // We'll wait a short time to allow the unhandled rejection to be processed
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test error in setTimeout
  console.log("\nTesting error in setTimeout:");
  await new Promise((resolve) => {
    setTimeout(() => {
      try {
        throw new Error("Error in setTimeout");
      } catch (error) {
        console.log("Caught setTimeout error:", error.message);
      } finally {
        resolve();
      }
    }, 100);
  });

  console.log("\nAll tests completed. Check your log file for results.");
}

runTests()
  .then(() => {
    // Give some time for any asynchronous logging to complete
    setTimeout(() => {
      console.log("Test script finished. Exiting.");
      process.exit(0);
    }, 1000);
  })
  .catch((error) => {
    console.error("An unexpected error occurred during testing:", error);
    process.exit(1);
  });
