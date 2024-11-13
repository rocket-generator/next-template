import { z } from "zod";
import { ApiError } from "@/exceptions/api_error";
import { APIClient } from "@/libraries/api_client";

export abstract class BaseRepository<T extends z.ZodType<any, any>> {
  protected schema: T;
  protected endpoint: string;
  protected accessToken?: string;

  protected constructor(schema: T, endpoint: string, accessToken?: string) {
    this.schema = schema;
    this.endpoint = endpoint;
    this.accessToken = accessToken;
  }

  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string
  ): Promise<{ data: z.infer<T>[]; count: number }> {
    const response = await APIClient<{ data: z.infer<T>[]; count: number }>({
      path: this.endpoint,
      params: { offset, limit, order, direction, query },
      accessToken: this.accessToken,
    });

    return {
      data: this.schema.array().parse(response.data),
      count: response.count,
    };
  }

  async getById(id: string): Promise<z.infer<T>> {
    const data = await APIClient<T>({
      path: `${this.endpoint}/${id}`,
      accessToken: this.accessToken,
    });
    return this.schema.parse(data);
  }

  async create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>> {
    const data = await APIClient<T>({
      method: "POST",
      path: this.endpoint,
      body: item,
      accessToken: this.accessToken,
    });
    return this.schema.parse(data);
  }

  async update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>> {
    const data = await APIClient<T>({
      method: "PUT",
      path: `${this.endpoint}/${id}`,
      body: item,
      accessToken: this.accessToken,
    });
    return this.schema.parse(data);
  }

  async delete(id: string): Promise<void> {
    const data = await APIClient<T>({
      method: "DELETE",
      path: `${this.endpoint}/${id}`,
      accessToken: this.accessToken,
    });
    if (!data) {
      throw new ApiError("Failed to delete item");
    }
  }
}
