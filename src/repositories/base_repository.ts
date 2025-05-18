import { z } from "zod";

export abstract class BaseRepository<
  T extends z.ZodObject<z.ZodRawShape, "strip">
> {
  protected schema: T;

  protected constructor(schema: T) {
    this.schema = schema;
  }

  abstract get(
    offset?: number,
    limit?: number,
    order?: string,
    direction?: string,
    query?: string
  ): Promise<{ data: z.infer<T>[]; count: number }>;

  abstract findById(id: string): Promise<z.infer<T>>;

  abstract create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>>;

  abstract update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>>;

  abstract delete(id: string): Promise<void>;
}
