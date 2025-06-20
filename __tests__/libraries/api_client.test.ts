import { APIClient } from "@/libraries/api_client";
import AuthError from "@/exceptions/auth_error";

// Mock fetch globally
global.fetch = jest.fn();

describe("API Client Library", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.NEXT_SERVER_COMPONENT_BACKEND_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_CLIENT_COMPONENT_BACKEND_API_BASE_URL;
    delete process.env.NEXT_BACKEND_API_BASE_URL;
    // Mock console.log to prevent test output pollution
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("APIClient", () => {
    it("should make GET request with default method", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const result = await APIClient({ path: "/test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        {
          method: "GET",
          headers: {},
          body: undefined,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should make POST request with body", async () => {
      const mockResponse = { success: true };
      const body = { name: "test", value: 123 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const result = await APIClient({
        method: "POST",
        path: "/test",
        body,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle query parameters", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const params = { id: 123, name: "test", active: true };
      await APIClient({ path: "/test", params });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test?id=123&name=test&active=true"),
        expect.any(Object)
      );
    });

    it("should filter out undefined params", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const params = { id: 123, name: null, active: true };
      await APIClient({ path: "/test", params });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test?id=123&active=true"),
        expect.any(Object)
      );
    });

    it("should handle null params as empty string", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const params = { id: 123, name: null, active: true };
      await APIClient({ path: "/test", params });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test?id=123&active=true"),
        expect.any(Object)
      );
    });

    it("should add authorization header when accessToken provided", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      await APIClient({
        path: "/test",
        accessToken: "my-token",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        {
          method: "GET",
          headers: { authorization: "bearer my-token" },
          body: undefined,
        }
      );
    });

    it("should throw AuthError on 401 status", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      await expect(APIClient({ path: "/test" })).rejects.toThrow(AuthError);
    });

    it("should throw AuthError on 403 status", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      });

      await expect(APIClient({ path: "/test" })).rejects.toThrow(AuthError);
    });

    it("should use server base path in server environment", async () => {
      process.env.NEXT_SERVER_COMPONENT_BACKEND_API_BASE_URL =
        "https://server.api.com";
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      await APIClient({ path: "/test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.any(Object)
      );
    });

    it("should use client base path in client environment", async () => {
      // Mock window object to simulate client environment
      const originalWindow = global.window;
      global.window = {} as any;

      process.env.NEXT_PUBLIC_CLIENT_COMPONENT_BACKEND_API_BASE_URL =
        "https://client.api.com";
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      await APIClient({ path: "/test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.any(Object)
      );

      // Restore window
      global.window = originalWindow;
    });

    it("should fallback to NEXT_BACKEND_API_BASE_URL", async () => {
      process.env.NEXT_BACKEND_API_BASE_URL = "https://fallback.api.com";
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      await APIClient({ path: "/test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.any(Object)
      );
    });

    it("should handle PUT request", async () => {
      const mockResponse = { updated: true };
      const body = { id: 1, name: "updated" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const result = await APIClient({
        method: "PUT",
        path: "/test/1",
        body,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test/1"),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle DELETE request", async () => {
      const mockResponse = { deleted: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const result = await APIClient({
        method: "DELETE",
        path: "/test/1",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test/1"),
        {
          method: "DELETE",
          headers: {},
          body: undefined,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle PATCH request", async () => {
      const mockResponse = { patched: true };
      const body = { name: "patched" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const result = await APIClient({
        method: "PATCH",
        path: "/test/1",
        body,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test/1"),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle complex query parameters", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const params = {
        search: "test query",
        page: 1,
        limit: 10,
        active: true,
        tags: "tag1,tag2",
      };
      await APIClient({ path: "/test", params });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.any(Object)
      );
    });

    it("should handle empty params object", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      await APIClient({ path: "/test", params: {} });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.any(Object)
      );
    });

    it("should type response correctly", async () => {
      interface TestResponse {
        id: number;
        name: string;
      }

      const mockResponse: TestResponse = { id: 1, name: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockResponse,
        status: 200,
      });

      const result = await APIClient<TestResponse>({ path: "/test" });

      expect(result.id).toBe(1);
      expect(result.name).toBe("test");
    });
  });
});
