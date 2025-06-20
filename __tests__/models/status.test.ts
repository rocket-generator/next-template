import { StatusSchema, Status } from "@/models/status";

describe("Status Model", () => {
  describe("StatusSchema", () => {
    it("should validate a valid status object", () => {
      const validStatus = {
        success: true,
        message: "Operation completed successfully",
        code: 200,
      };

      const result = StatusSchema.parse(validStatus);
      expect(result).toEqual(validStatus);
    });

    it("should validate status with optional invalid_params", () => {
      const validStatus = {
        success: false,
        message: "Validation failed",
        invalid_params: ["email", "password"],
        code: 400,
      };

      const result = StatusSchema.parse(validStatus);
      expect(result).toEqual(validStatus);
    });

    it("should validate status without invalid_params", () => {
      const validStatus = {
        success: true,
        message: "Success",
        code: 201,
      };

      const result = StatusSchema.parse(validStatus);
      expect(result).toEqual(validStatus);
      expect(result.invalid_params).toBeUndefined();
    });

    it("should fail validation when success is not boolean", () => {
      const invalidStatus = {
        success: "true", // Should be boolean
        message: "Test",
        code: 200,
      };

      expect(() => StatusSchema.parse(invalidStatus)).toThrow();
    });

    it("should fail validation when message is not string", () => {
      const invalidStatus = {
        success: true,
        message: 123, // Should be string
        code: 200,
      };

      expect(() => StatusSchema.parse(invalidStatus)).toThrow();
    });

    it("should fail validation when code is not number", () => {
      const invalidStatus = {
        success: true,
        message: "Test",
        code: "200", // Should be number
      };

      expect(() => StatusSchema.parse(invalidStatus)).toThrow();
    });

    it("should fail validation when invalid_params is not array", () => {
      const invalidStatus = {
        success: false,
        message: "Test",
        invalid_params: "email", // Should be array
        code: 400,
      };

      expect(() => StatusSchema.parse(invalidStatus)).toThrow();
    });

    it("should fail validation when invalid_params contains non-string", () => {
      const invalidStatus = {
        success: false,
        message: "Test",
        invalid_params: ["email", 123], // Should be all strings
        code: 400,
      };

      expect(() => StatusSchema.parse(invalidStatus)).toThrow();
    });

    it("should fail validation when required fields are missing", () => {
      const invalidStatus1 = {
        // missing success
        message: "Test",
        code: 200,
      };

      const invalidStatus2 = {
        success: true,
        // missing message
        code: 200,
      };

      const invalidStatus3 = {
        success: true,
        message: "Test",
        // missing code
      };

      expect(() => StatusSchema.parse(invalidStatus1)).toThrow();
      expect(() => StatusSchema.parse(invalidStatus2)).toThrow();
      expect(() => StatusSchema.parse(invalidStatus3)).toThrow();
    });

    it("should handle empty invalid_params array", () => {
      const validStatus = {
        success: true,
        message: "No errors",
        invalid_params: [],
        code: 200,
      };

      const result = StatusSchema.parse(validStatus);
      expect(result.invalid_params).toEqual([]);
    });

    it("should handle various status codes", () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500, 503];

      statusCodes.forEach((code) => {
        const status = {
          success: code < 400,
          message: `Status code ${code}`,
          code,
        };

        const result = StatusSchema.parse(status);
        expect(result.code).toBe(code);
      });
    });

    it("should handle long messages", () => {
      const validStatus = {
        success: false,
        message: "a".repeat(1000),
        code: 500,
      };

      const result = StatusSchema.parse(validStatus);
      expect(result.message.length).toBe(1000);
    });

    it("should handle special characters in message", () => {
      const validStatus = {
        success: true,
        message: "日本語メッセージ、特殊文字!@#$%^&*()",
        code: 200,
      };

      const result = StatusSchema.parse(validStatus);
      expect(result.message).toBe("日本語メッセージ、特殊文字!@#$%^&*()");
    });
  });

  describe("Status Type", () => {
    it("should infer correct type", () => {
      const status: Status = {
        success: true,
        message: "Type test",
        code: 200,
      };

      // TypeScript will ensure this compiles
      expect(status.success).toBe(true);
      expect(status.message).toBe("Type test");
      expect(status.code).toBe(200);
    });

    it("should allow optional invalid_params in type", () => {
      const status1: Status = {
        success: true,
        message: "Without invalid_params",
        code: 200,
      };

      const status2: Status = {
        success: false,
        message: "With invalid_params",
        invalid_params: ["field1", "field2"],
        code: 400,
      };

      expect(status1.invalid_params).toBeUndefined();
      expect(status2.invalid_params).toEqual(["field1", "field2"]);
    });
  });
});
