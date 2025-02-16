import { BaseRepository } from "base_repository";
import type {
  ChatMessage,
  ChatHistoryResponse,
  ConversationsResponse,
  SuggestedQuestionsResponse,
} from "@/models/app/chat";
import type {
    ChatMessageRequest
} from "@/requests/app/chat_request"

export class ChatRepository extends BaseRepository {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    super();
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async getConversations(params: {
    last_id?: string;
    limit?: number;
    pinned?: boolean;
    user: string;
  }): Promise<ConversationsResponse> {
    const queryParams = new URLSearchParams();
    if (params.last_id) queryParams.append("last_id", params.last_id);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.pinned !== undefined)
      queryParams.append("pinned", params.pinned.toString());
    queryParams.append("user", params.user);

    const response = await fetch(
      `${this.baseUrl}/conversations?${queryParams.toString()}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }

    return response.json();
  }

  async deleteConversation(
    conversationId: string,
    user: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: this.getHeaders(),
        body: JSON.stringify({ user }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete conversation");
    }
  }

  async getMessages(params: {
    conversation_id: string;
    first_id?: string;
    limit?: number;
    user: string;
  }): Promise<ChatHistoryResponse> {
    const queryParams = new URLSearchParams({
      conversation_id: params.conversation_id,
      user: params.user,
    });
    if (params.first_id) queryParams.append("first_id", params.first_id);
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${this.baseUrl}/messages?${queryParams.toString()}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return response.json();
  }

  async sendMessage(message: ChatMessageRequest): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/chat-messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return response.json();
  }

  async getSuggestedQuestions(
    messageId: string,
    user: string
  ): Promise<SuggestedQuestionsResponse> {
    const queryParams = new URLSearchParams({
      user,
    });

    const response = await fetch(
      `${
        this.baseUrl
      }/messages/${messageId}/suggested?${queryParams.toString()}`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch suggested questions");
    }

    const rawResponse = await response.json();

    // Transform the API response into the expected format
    return {
      data: rawResponse.data.map((content: string, index: number) => ({
        id: `suggested-${index}`,
        content,
      })),
    };
  }

  async updateConversationName(
    conversationId: string,
    params: {
      name: string;
      auto_generate: boolean;
    }
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/name`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update conversation name: ${response.statusText}`);
    }
  }
}
