import { WorkflowInputValue } from "@/models/workflow";

export interface WorkflowRunOptions {
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

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}
