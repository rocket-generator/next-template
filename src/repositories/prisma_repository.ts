import { z } from "zod";
import { BaseRepository } from "./base_repository";
import { prisma } from "@/libraries/prisma";
import { SearchCondition } from "./base_repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPrismaModel(modelName: string): any {
  // keyof typeofを使用してprisma clientのモデル名を取得し、それに対応するモデルを返す
  return prisma[modelName as keyof typeof prisma];
}

type TransformFunction<T extends z.ZodObject<z.ZodRawShape, "strip">> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaData: any
) => z.infer<T>;

export class PrismaRepository<
  T extends z.ZodObject<z.ZodRawShape, "strip">
> extends BaseRepository<T> {
  protected modelName: string;
  protected searchFields: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected transform: TransformFunction<T>;

  protected constructor(
    schema: T,
    modelName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform: TransformFunction<T>,
    searchFields: string[]
  ) {
    super(schema);
    this.modelName = modelName;
    this.transform = transform;
    this.searchFields = searchFields;
  }

  async get(
    offset: number = 0,
    limit: number = 20,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: SearchCondition[]
  ): Promise<{ data: z.infer<T>[]; count: number }> {
    const orderBy = order
      ? { [order]: direction === "desc" ? "desc" : "asc" }
      : undefined;

    const where = this.buildWhereClause(query, conditions);

    const [prismaData, count] = await Promise.all([
      getPrismaModel(this.modelName).findMany({
        skip: offset,
        take: limit,
        orderBy,
        where,
      }),
      getPrismaModel(this.modelName).count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedData = prismaData.map((item: any) => this.transform(item));

    return {
      data: this.schema.array().parse(transformedData),
      count,
    };
  }

  async findById(id: string): Promise<z.infer<T>> {
    const prismaData = await getPrismaModel(this.modelName).findUnique({
      where: { id },
    });

    if (!prismaData) {
      throw new Error(`${this.modelName} with id ${id} not found`);
    }

    const transformedData = this.transform(prismaData);
    return this.schema.parse(transformedData);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(item: Omit<z.infer<T>, "id">): Promise<z.infer<T>> {
    // Note: We assume the input 'item' already matches the Zod schema structure,
    // potentially needing transformation *before* sending to Prisma if structures differ significantly.
    // For now, we transform only the *response* from Prisma.
    const prismaData = await getPrismaModel(this.modelName).create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: item as any, // Potentially needs transformation to Prisma model structure
    });

    const transformedData = this.transform(prismaData);
    return this.schema.parse(transformedData);
  }

  async update(id: string, item: Partial<z.infer<T>>): Promise<z.infer<T>> {
    // Similar note as 'create': input 'item' might need transformation before Prisma update.
    const prismaData = await getPrismaModel(this.modelName).update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: item as any, // Potentially needs transformation to Prisma model structure
    });

    const transformedData = this.transform(prismaData);
    return this.schema.parse(transformedData);
  }

  async delete(id: string): Promise<void> {
    await getPrismaModel(this.modelName).delete({
      where: { id },
    });
  }

  // Build WHERE clause combining query search and conditions
  protected buildWhereClause(
    query?: string,
    conditions?: SearchCondition[]
  ): Record<string, unknown> {
    const queryCondition = this.buildQuerySearch(query);
    const searchCondition = conditions ? this.buildSearchQuery(conditions) : {};

    if (
      Object.keys(queryCondition).length === 0 &&
      Object.keys(searchCondition).length === 0
    ) {
      return {};
    }

    if (Object.keys(queryCondition).length === 0) {
      return searchCondition;
    }

    if (Object.keys(searchCondition).length === 0) {
      return queryCondition;
    }

    return {
      AND: [queryCondition, searchCondition],
    };
  }

  // Build query search condition (LIKE search with OR)
  protected buildQuerySearch(query?: string): Record<string, unknown> {
    if (!query || query.trim() === "" || this.searchFields.length === 0) {
      return {};
    }

    const orConditions = this.searchFields.map((field) => ({
      [field]: {
        contains: query.trim(),
        mode: "insensitive",
      },
    }));

    return orConditions.length === 1 ? orConditions[0] : { OR: orConditions };
  }

  // Updated buildSearchQuery method
  protected buildSearchQuery(
    conditions: SearchCondition[]
  ): Record<string, unknown> {
    if (!conditions || conditions.length === 0) {
      return {};
    }

    const prismaConditions = conditions
      .map((condition): Record<string, unknown> => {
        const { column, value } = condition;
        const operator = condition.operator ?? "=";

        switch (operator) {
          case "=":
            return { [column]: { equals: value } };
          case "!=":
            return { [column]: { not: value } };
          case "contains":
            if (typeof value !== "string") {
              console.warn(
                `Operator 'contains' requires string value for column '${column}'. Got ${typeof value}`
              );
              return {};
            }
            return { [column]: { contains: value, mode: "insensitive" } };
          case ">":
            if (
              typeof value !== "number" &&
              typeof value !== "string" &&
              !(value instanceof Date)
            ) {
              console.warn(
                `Operator '>' requires number, string or Date value for column '${column}'. Got ${typeof value}`
              );
              return {};
            }
            return { [column]: { gt: value } };
          case ">=":
            if (
              typeof value !== "number" &&
              typeof value !== "string" &&
              !(value instanceof Date)
            ) {
              console.warn(
                `Operator '>=' requires number, string or Date value for column '${column}'. Got ${typeof value}`
              );
              return {};
            }
            return { [column]: { gte: value } };
          case "<":
            if (
              typeof value !== "number" &&
              typeof value !== "string" &&
              !(value instanceof Date)
            ) {
              console.warn(
                `Operator '<' requires number, string or Date value for column '${column}'. Got ${typeof value}`
              );
              return {};
            }
            return { [column]: { lt: value } };
          case "<=":
            if (
              typeof value !== "number" &&
              typeof value !== "string" &&
              !(value instanceof Date)
            ) {
              console.warn(
                `Operator '<=' requires number, string or Date value for column '${column}'. Got ${typeof value}`
              );
              return {};
            }
            return { [column]: { lte: value } };
          case "in":
            if (!Array.isArray(value)) {
              console.warn(
                `Operator 'in' requires an array value for column '${column}'. Got ${typeof value}`
              );
              return {};
            }
            // Prisma expects array elements to be of consistent type, e.g., string[] or number[]
            // Further validation might be needed depending on the column type
            return { [column]: { in: value } };
          default:
            // Should not happen with TypeScript checking SearchOperator type
            console.warn(
              `Unsupported operator detected: ${operator as string}`
            );
            return {};
        }
      })
      .filter((c) => Object.keys(c).length > 0); // Filter out invalid conditions

    if (prismaConditions.length === 0) {
      return {};
    }

    // If there's only one condition, don't wrap it in AND
    if (prismaConditions.length === 1) {
      return prismaConditions[0];
    }

    return {
      AND: prismaConditions,
    };
  }
}
