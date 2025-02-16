export interface ChatMessage {
    id: string;
    conversation_id: string;
    query: string;
    answer: string;
    created_at: string;
    feedback?: "like" | "dislike" | null;
    inputs?: {
      mode: "agent" | "trigger";
      framework: string;
    };
  }
  
  export interface ChatConversation {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    pinned: boolean;
    inputs?: {
      mode?: "agent" | "trigger";
      framework?: string;
    };
  }
  
  export interface SuggestedQuestion {
    id: string;
    content: string;
  }
  
  export interface ChatHistoryResponse {
    data: ChatMessage[];
    has_more: boolean;
    next_cursor?: string;
  }
  
  export interface ConversationsResponse {
    data: ChatConversation[];
    has_more: boolean;
    next_cursor?: string;
  }
  
  export interface SuggestedQuestionsResponse {
    data: SuggestedQuestion[];
  }
