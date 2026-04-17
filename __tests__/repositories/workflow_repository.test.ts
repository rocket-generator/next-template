import { WorkflowRepository } from "@/repositories/workflow_repository";
import { ReadableStream } from "node:stream/web";
import {
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

global.fetch = jest.fn();
Object.defineProperty(globalThis, "ReadableStream", {
  value: ReadableStream,
  configurable: true,
});

function createWorkflowRunResponse(outputText: string): string {
  return JSON.stringify({
    workflow_run_id: "run-1",
    task_id: "task-1",
    data: {
      id: "execution-1",
      workflow_id: "workflow-1",
      status: "succeeded",
      outputs: {
        text: outputText,
      },
      error: null,
      elapsed_time: 1,
      total_tokens: 2,
      total_steps: 3,
      created_at: 1710000000,
      finished_at: 1710000001,
    },
  });
}

function createMockResponse(overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({}),
    text: async () => "",
    body: null,
    ...overrides,
  } as Response;
}

describe("WorkflowRepository", () => {
  let repository: WorkflowRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    installTestLoggerAdapters();
    repository = new WorkflowRepository(
      "https://workflow.example.test",
      "workflow-token"
    );
  });

  afterEach(() => {
    resetTestLoggerState();
  });

  describe("uploadFile", () => {
    it("should log an error with truncated upstream error text when upload fails", async () => {
      const upstreamError = "x".repeat(520);
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          text: async () => upstreamError,
        })
      );

      await expect(
        repository.uploadFile(
          new File(["hello"], "hello.txt", { type: "text/plain" }),
          "user-1"
        )
      ).rejects.toThrow("Failed to upload file: Internal Server Error");

      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "workflow_repository",
          event: "workflow_repository.upload.failed",
          context: expect.objectContaining({
            operation: "upload",
            status: 500,
            statusText: "Internal Server Error",
          }),
        }),
      ]);
      expect(getLoggedEntries()[0]?.context).toMatchObject({
        errorText: `${"x".repeat(512)}...`,
      });
    });
  });

  describe("run", () => {
    it("should log an error and throw when markdown JSON parsing fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          text: async () => createWorkflowRunResponse("{invalid}"),
        })
      );

      await expect(
        repository.run({
          inputs: {},
          response_mode: "blocking",
          user: "user-1",
        })
      ).rejects.toThrow("Failed to parse JSON from markdown block");

      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "workflow_repository",
          event: "workflow_repository.run.parse_failed",
          context: expect.objectContaining({
            operation: "run",
            outputPreview: "{invalid}",
          }),
        }),
      ]);
    });
  });

  describe("runStreaming", () => {
    it("should warn on chunk parse failure and continue streaming valid chunks", async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              [
                "data: not-json",
                'data: {"event":"workflow_started","task_id":"task-1","workflow_run_id":"run-1"}',
              ].join("\n")
            )
          );
          controller.close();
        },
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          body: stream as Response["body"],
        })
      );

      const result = await repository.runStreaming({
        inputs: {},
        response_mode: "blocking",
        user: "user-1",
      });

      const reader = result.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
      }

      expect(chunks).toEqual([
        {
          event: "workflow_started",
          task_id: "task-1",
          workflow_run_id: "run-1",
        },
      ]);
      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "warn",
          scope: "workflow_repository",
          event: "workflow_repository.run_streaming.chunk_parse_failed",
          context: expect.objectContaining({
            operation: "run_streaming",
            chunkPreview: "not-json",
          }),
        }),
      ]);
    });
  });

  describe("stop", () => {
    it("should log an error with truncated upstream error text when stop fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 409,
          statusText: "Conflict",
          text: async () => "unable to stop workflow",
        })
      );

      await expect(repository.stop("task-1", "user-1")).rejects.toThrow(
        "Failed to stop workflow: Conflict"
      );

      expect(getLoggedEntries()).toEqual([
        expect.objectContaining({
          level: "error",
          scope: "workflow_repository",
          event: "workflow_repository.stop.failed",
          context: expect.objectContaining({
            operation: "stop",
            status: 409,
            statusText: "Conflict",
            errorText: "unable to stop workflow",
          }),
        }),
      ]);
    });
  });
});
