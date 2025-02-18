import { z } from "zod";

// 画像の型定義
const WorkflowImageSchema = z.object({
  type: z.literal("image"),
  transfer_method: z.enum(["local_file", "remote_url"]),
  url: z.string(),
  upload_file_id: z.string(),
});

export type WorkflowImage = z.infer<typeof WorkflowImageSchema>;

// 入力値の型定義
export const WorkflowInputValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(WorkflowImageSchema),
  z.record(z.string(), z.string()),
  z.record(z.string(), z.number()),
]);

export type WorkflowInputValue = z.infer<typeof WorkflowInputValueSchema>;

// 出力値の型定義
export const WorkflowOutputValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.object({})), // Allow array of any object
  z.record(z.string(), z.string()),
  z.record(z.string(), z.number()),
]);

export type WorkflowOutputValue = z.infer<typeof WorkflowOutputValueSchema>;

// ワークフロー実行結果のスキーマ
export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  workflow_id: z.string(),
  status: z.enum(["running", "succeeded", "failed", "stopped"]),
  outputs: z.record(z.string(), WorkflowOutputValueSchema).nullable(),
  error: z.string().nullable(),
  elapsed_time: z.number(),
  total_tokens: z.number(),
  total_steps: z.number(),
  created_at: z.number(),
  finished_at: z.number().nullable(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

// ノードデータの型定義
export const WorkflowNodeDataSchema = z.object({
  id: z.string(),
  node_id: z.string().optional(),
  node_type: z.string().optional(),
  title: z.string().optional(),
  index: z.number().optional(),
  predecessor_node_id: z.string().optional(),
  inputs: z.record(z.string(), WorkflowInputValueSchema).optional(),
  outputs: z.record(z.string(), WorkflowOutputValueSchema).optional(),
  status: z.enum(["running", "succeeded", "failed", "stopped"]).optional(),
  error: z.string().optional(),
  elapsed_time: z.number().optional(),
  execution_metadata: z
    .object({
      total_tokens: z.number().optional(),
      total_price: z.number().optional(),
      currency: z.string().optional(),
    })
    .optional(),
  created_at: z.number().optional(),
});

export type WorkflowNodeData = z.infer<typeof WorkflowNodeDataSchema>;

// ストリーミングチャンクのスキーマ
export const WorkflowStreamChunkSchema = z.object({
  event: z.enum([
    "workflow_started",
    "node_started",
    "node_finished",
    "workflow_finished",
    "tts_message",
    "tts_message_end",
    "ping",
  ]),
  task_id: z.string(),
  workflow_run_id: z.string().optional(),
  data: WorkflowNodeDataSchema.optional(),
  message_id: z.string().optional(),
  audio: z.string().optional(),
  created_at: z.number().optional(),
});

export type WorkflowStreamChunk = z.infer<typeof WorkflowStreamChunkSchema>;
