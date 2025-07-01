import { z } from "zod";

// Define and export SearchOperator and SearchCondition here
export type SearchOperator =
  | "="
  | "!="
  | "contains"
  | ">"
  | ">="
  | "<"
  | "<="
  | "in";

export interface SearchCondition {
  column: string;
  value: unknown; // Use unknown instead of any
  operator?: SearchOperator; // Optional, defaults to '='
}

export interface BaseRepositoryInterface<
  T extends z.ZodObject<z.ZodRawShape, "strip">
> {
  get(
    offset?: number,
    limit?: number,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: SearchCondition[]
  ): Promise<{ data: z.infer<T>[]; count: number }>;
  findById(id: string): Promise<z.infer<T>>;
  create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>>;
  update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>>;
  delete(id: string): Promise<void>;
}

export abstract class BaseRepository<
  T extends z.ZodObject<z.ZodRawShape, "strip">
> implements BaseRepositoryInterface<T>
{
  protected schema: T;
  protected abstract searchFields: string[];

  protected constructor(schema: T) {
    this.schema = schema;
  }

  abstract get(
    offset?: number,
    limit?: number,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: SearchCondition[]
  ): Promise<{ data: z.infer<T>[]; count: number }>;

  abstract findById(id: string): Promise<z.infer<T>>;

  abstract create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>>;

  abstract update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>>;

  abstract delete(id: string): Promise<void>;
}
