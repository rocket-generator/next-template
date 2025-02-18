export interface ChatMessageRequest {
  query: string;
  conversation_id?: string;
  response_mode?: "streaming" | "blocking";
  auto_generate_name?: boolean;
  user: string;
  inputs: {
    mode: "agent" | "trigger";
    framework: string;
  };
}
