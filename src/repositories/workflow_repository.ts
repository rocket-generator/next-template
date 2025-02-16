import { BaseRepository } from "./base_repository";
import {
  WorkflowExecution,
  WorkflowExecutionSchema,
  WorkflowStreamChunk,
  WorkflowStreamChunkSchema,
  WorkflowInputValue,
} from "@/models/workflow";

interface WorkflowRunOptions {
  inputs: Record<string, WorkflowInputValue>;
  response_mode: "streaming" | "blocking";
  user: string;
  files?: Array<{
    type: "document" | "image" | "audio" | "video" | "custom";
    transfer_method: "remote_url" | "local_file";
    url?: string;
    upload_file_id?: string;
  }>;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

export class WorkflowRepository extends BaseRepository<typeof WorkflowExecutionSchema> {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  private cleanJsonString(jsonStr: string): string {
    // Find the first occurrence of '{'
    const startIndex = jsonStr.indexOf('{');
    // Find the last occurrence of '}'
    const endIndex = jsonStr.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Invalid JSON string: missing brackets');
    }
    
    // Extract only the JSON part
    return jsonStr.slice(startIndex, endIndex + 1);
  }

  constructor(accessToken?: string) {
    super(WorkflowExecutionSchema, "/workflows", accessToken);

    const baseUrl = process.env.NEXT_PUBLIC_DIFY_API_URL;
    const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error("Dify API URL or API Key is not set in environment variables");
    }

    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders(contentType: string = "application/json"): HeadersInit {
    return {
      "Content-Type": contentType,
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private getUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  async uploadFile(file: File, user: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user", user);

    const response = await fetch(this.getUrl("/files/upload"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
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
    console.log("Running workflow with options:", options);
    console.log("URL:", this.getUrl("/workflows/run"));
    const response = await fetch(this.getUrl("/workflows/run"), {
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
    console.log("Workflow run response:", data);

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

  async runStreaming(options: WorkflowRunOptions): Promise<ReadableStream<WorkflowStreamChunk>> {
    const response = await fetch(this.getUrl("/workflows/run"), {
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
                    const validatedChunk = WorkflowStreamChunkSchema.parse(parsed);
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
      this.getUrl(`/workflows/tasks/${taskId}/stop`),
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
      this.getUrl(`/workflows/run/${workflowId}`),
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get workflow execution: ${response.statusText}`);
    }

    const data = await response.json();
    return WorkflowExecutionSchema.parse(data);
  }
}
