import { BaseRepository } from "./base_repository";
import {
  WorkflowExecution,
  WorkflowExecutionSchema,
  WorkflowStreamChunk,
  WorkflowStreamChunkSchema,
} from "@/models/workflow";
import type {
  WorkflowRunOptions,
  UploadedFile,
} from "@/requests/workflow_request";

export class WorkflowRepository extends BaseRepository<
  typeof WorkflowExecutionSchema
> {
  constructor(baseUrl: string, apiKey: string) {
    super(WorkflowExecutionSchema, baseUrl, apiKey);
  }

  private getHeaders(contentType: string = "application/json"): HeadersInit {
    return {
      "Content-Type": contentType,
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  private cleanJsonString(jsonStr: string): string {
    const startIndex = jsonStr.indexOf("{");
    const endIndex = jsonStr.lastIndexOf("}");

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Invalid JSON string: missing brackets");
    }

    return jsonStr.slice(startIndex, endIndex + 1);
  }

  async uploadFile(file: File, user: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", user);

    const response = await fetch(`${this.endpoint}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to upload file:", errorText);
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return response.json();
  }

  async run(options: WorkflowRunOptions): Promise<{
    workflow_run_id: string;
    task_id: string;
    data: WorkflowExecution;
  }> {
    const response = await fetch(`${this.endpoint}/workflows/run`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to stop workflow:", errorText);
      throw new Error(`Failed to run workflow: ${response.statusText}`);
    }

    const rawData = await response.text();
    const data = JSON.parse(rawData);

    // Extract and parse the JSON string from the text output
    const outputText = data.data.outputs.text;
    const cleanedData = this.cleanJsonString(outputText);
    try {
      data.data.outputs = JSON.parse(cleanedData);
    } catch (error) {
      console.error("Failed to parse JSON from markdown block:", error);
      throw new Error("Failed to parse JSON from markdown block");
    }

    return {
      workflow_run_id: data.workflow_run_id,
      task_id: data.task_id,
      data: WorkflowExecutionSchema.parse(data.data),
    };
  }

  async runStreaming(
    options: WorkflowRunOptions
  ): Promise<ReadableStream<WorkflowStreamChunk>> {
    const response = await fetch(`${this.endpoint}/workflows/run`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...options,
        response_mode: "streaming",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to run workflow: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream({
      start: async (controller) => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6);
                if (jsonStr.trim()) {
                  try {
                    const cleanedJsonStr = this.cleanJsonString(jsonStr);
                    const parsed = JSON.parse(cleanedJsonStr);
                    const validatedChunk =
                      WorkflowStreamChunkSchema.parse(parsed);
                    controller.enqueue(validatedChunk);
                  } catch (e) {
                    console.error("Failed to parse chunk:", e);
                  }
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });
  }

  async stop(taskId: string, user: string): Promise<{ result: string }> {
    const response = await fetch(
      `${this.endpoint}/workflows/tasks/${taskId}/stop`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ user }),
      }
    );

    if (!response.ok) {
      console.error("Failed to stop workflow:", response.statusText);
      throw new Error(`Failed to stop workflow: ${response.statusText}`);
    }

    return response.json();
  }

  async getExecution(workflowId: string): Promise<WorkflowExecution> {
    const response = await fetch(
      `${this.endpoint}/workflows/run/${workflowId}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get workflow execution: ${response.statusText}`
      );
    }

    const data = await response.json();
    return WorkflowExecutionSchema.parse(data);
  }
}
