import { z } from "zod";
import { ApiError } from "@/exceptions/api_error";
import { APIClient } from "@/libraries/api_client";
import { createLogger } from "@/libraries/logger";
import {
  BaseRepository,
  RepositorySchema,
  SearchCondition,
} from "./base_repository";

const apiRepositoryLogger = createLogger("api_repository");

export abstract class APIRepository<
  T extends RepositorySchema
> extends BaseRepository<T> {
  protected endpoint: string;
  protected accessToken?: string;

  protected constructor(schema: T, endpoint: string, accessToken?: string) {
    super(schema);
    this.endpoint = endpoint;
    this.accessToken = accessToken;
  }

  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: SearchCondition[]
  ): Promise<{ data: z.infer<T>[]; count: number }> {
    if (conditions && conditions.length > 0) {
      apiRepositoryLogger.debug(
        "api_repository.get.conditions",
        "Repository get conditions",
        {
          context: {
            count: conditions.length,
            columns: conditions.map((condition) => condition.column),
            operators: conditions.map((condition) => condition.operator ?? "="),
          },
        }
      );
    }

    const response = await APIClient<{ data: z.infer<T>[]; count: number }>({
      path: this.endpoint,
      params: {
        offset,
        limit,
        ...(order && { order }),
        ...(direction && { direction }),
        ...(query && { query }),
      },
      accessToken: this.accessToken,
    });

    return {
      data: this.schema.array().parse(response.data),
      count: response.count,
    };
  }

  async findById(id: string): Promise<z.infer<T>> {
    const data = await APIClient<z.infer<T>>({
      path: `${this.endpoint}/${id}`,
      accessToken: this.accessToken,
    });
    return this.schema.parse(data);
  }

  async create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>> {
    const data = await APIClient<z.infer<T>>({
      method: "POST",
      path: this.endpoint,
      body: item,
      accessToken: this.accessToken,
    });
    return this.schema.parse(data);
  }

  async update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>> {
    const data = await APIClient<z.infer<T>>({
      method: "PUT",
      path: `${this.endpoint}/${id}`,
      body: item,
      accessToken: this.accessToken,
    });
    return this.schema.parse(data);
  }

  async delete(id: string): Promise<void> {
    const data = await APIClient<z.infer<T>>({
      method: "DELETE",
      path: `${this.endpoint}/${id}`,
      accessToken: this.accessToken,
    });
    if (!data) {
      throw new ApiError("Failed to delete item");
    }
  }
}
