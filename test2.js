// test2.js
import LoggerWrapper from "./dist/log/LoggerWrapper.js";

async function faultyFunction() {
  // Simulating an error in an async function
  throw new Error("This is a test error for stack trace logging.");
}

faultyFunction();
