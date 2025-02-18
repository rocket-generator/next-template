import { z } from "zod";

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  query: z.string(),
  answer: z.string(),
  created_at: z.string(),
  feedback: z
    .union([z.literal("like"), z.literal("dislike"), z.null()])
    .optional(),
  inputs: z
    .object({
      mode: z.union([z.literal("agent"), z.literal("trigger")]),
      framework: z.string(),
    })
    .optional(),
});

export const ChatConversationSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  pinned: z.boolean(),
  inputs: z
    .object({
      mode: z.union([z.literal("agent"), z.literal("trigger")]).optional(),
      framework: z.string().optional(),
    })
    .optional(),
});

export const SuggestedQuestionSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type SuggestedQuestion = z.infer<typeof SuggestedQuestionSchema>;

export const ChatHistoryResponseSchema = z.object({
  data: z.array(ChatMessageSchema),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
});

export const ConversationsResponseSchema = z.object({
  data: z.array(ChatConversationSchema),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
});

export const SuggestedQuestionsResponseSchema = z.object({
  data: z.array(SuggestedQuestionSchema),
});

export type ChatHistoryResponse = z.infer<typeof ChatHistoryResponseSchema>;
export type ConversationsResponse = z.infer<typeof ConversationsResponseSchema>;
export type SuggestedQuestionsResponse = z.infer<
  typeof SuggestedQuestionsResponseSchema
>;
