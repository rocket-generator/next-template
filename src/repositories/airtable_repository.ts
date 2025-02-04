import { z } from "zod";
import { BaseRepository } from "./base_repository";

interface AirTableConfig {
  baseId: string;
  viewId: string;
}

interface AirTableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

interface AirTableResponse<T> {
  records: AirTableRecord<T>[];
  offset?: string;
}

export abstract class AirTableRepository<
  T extends z.ZodObject<z.ZodRawShape, "strip">
> extends BaseRepository<T> {
  private readonly baseId: string;
  private readonly viewId: string;
  private readonly apiKey: string;
  private readonly appId: string;

  protected constructor(
    schema: T,
    endpoint: string,
    config: AirTableConfig,
    accessToken?: string
  ) {
    super(schema, endpoint, accessToken);

    const apiKey = process.env.AIRTABLE_API_KEY;
    const appId = process.env.AIRTABLE_APP_ID;

    if (!apiKey || !appId) {
      throw new Error(
        "AirTable API key or App ID is not set in environment variables"
      );
    }

    this.apiKey = apiKey;
    this.appId = appId;
    this.baseId = config.baseId;
    this.viewId = config.viewId;
  }

  private getAirTableHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private getAirTableUrl(path: string = ""): string {
    return `https://api.airtable.com/v0/${this.appId}/${this.baseId}${path}`;
  }

  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string
  ): Promise<{ data: z.infer<T>[]; count: number }> {
    const params = new URLSearchParams({
      pageSize: limit.toString(),
      offset: offset.toString(),
      view: this.viewId,
    });

    if (order) params.append("sort[0][field]", order);
    if (direction) params.append("sort[0][direction]", direction);
    if (query) params.append("filterByFormula", query);

    const response = await fetch(
      `${this.getAirTableUrl()}?${params.toString()}`,
      {
        headers: this.getAirTableHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`AirTable API error: ${response.statusText}`);
    }

    const result = (await response.json()) as AirTableResponse<z.infer<T>>;
    const records = result.records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));

    return {
      data: this.schema.array().parse(records),
      count: result.offset
        ? parseInt(result.offset) + records.length
        : records.length,
    };
  }

  async findById(id: string): Promise<z.infer<T>> {
    const response = await fetch(this.getAirTableUrl(`/${id}`), {
      headers: this.getAirTableHeaders(),
    });

    if (!response.ok) {
      throw new Error(`AirTable API error: ${response.statusText}`);
    }

    const record = (await response.json()) as AirTableRecord<z.infer<T>>;
    const data = {
      id: record.id,
      ...record.fields,
    };

    return this.schema.parse(data);
  }

  async create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>> {
    const response = await fetch(this.getAirTableUrl(), {
      method: "POST",
      headers: this.getAirTableHeaders(),
      body: JSON.stringify({
        records: [
          {
            fields: item,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AirTable API error: ${response.statusText}`);
    }

    const result = (await response.json()) as AirTableResponse<z.infer<T>>;
    const record = result.records[0];
    const data = {
      id: record.id,
      ...record.fields,
    };

    return this.schema.parse(data);
  }

  async update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>> {
    const response = await fetch(this.getAirTableUrl(`/${id}`), {
      method: "PATCH",
      headers: this.getAirTableHeaders(),
      body: JSON.stringify({
        fields: item,
      }),
    });

    if (!response.ok) {
      throw new Error(`AirTable API error: ${response.statusText}`);
    }

    const record = (await response.json()) as AirTableRecord<z.infer<T>>;
    const data = {
      id: record.id,
      ...record.fields,
    };

    return this.schema.parse(data);
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(this.getAirTableUrl(`/${id}`), {
      method: "DELETE",
      headers: this.getAirTableHeaders(),
    });

    if (!response.ok) {
      throw new Error(`AirTable API error: ${response.statusText}`);
    }
  }
}
