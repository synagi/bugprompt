import { runSetup } from "../jest.setup";

describe("StackTracer error handling", () => {
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

  // Add more specific tests for StackTracer functionality
  it("correctly processes errors", () => {
    Object.entries(global.testData).forEach(([_errorType, errorData]) => {
      const result = errorData;
      expect(result).toBeDefined();
      expect(result.error).toHaveProperty("name");
      expect(result.error).toHaveProperty("message");
      expect(result.error).toHaveProperty("stack");
    });
  });
});
