import { AuthSchema } from "@/models/auth";
import { z } from "zod";
import { PrismaRepository } from "./prisma_repository";
import { auth } from "@/libraries/auth";
import { SearchCondition } from "./base_repository";

export interface AuthRepositoryInterface {
  get(
    offset?: number,
    limit?: number,
    order?: string,
    direction?: string,
    query?: string,
    conditions?: SearchCondition[]
  ): Promise<{ data: z.infer<typeof AuthSchema>[]; count: number }>;
  findById(id: string): Promise<z.infer<typeof AuthSchema>>;
  create(data: Omit<z.infer<typeof AuthSchema>, "id">): Promise<z.infer<typeof AuthSchema>>;
  update(id: string, data: Partial<z.infer<typeof AuthSchema>>): Promise<z.infer<typeof AuthSchema>>;
  delete(id: string): Promise<void>;
}

export abstract class AuthRepository extends PrismaRepository<
  typeof AuthSchema
> implements AuthRepositoryInterface {
  constructor(
    schema: typeof AuthSchema,
    modelName: string,
    converter: (data: unknown) => z.infer<typeof AuthSchema>,
    searchableColumns: string[]
  ) {
    super(schema, modelName, converter, searchableColumns);
  }

  async getMe(): Promise<z.infer<typeof AuthSchema>> {
    const session = await auth();
    if (!session || !session?.user?.id) {
      throw new Error("Unauthorized");
    }
    return this.findById(session.user.id);
  }
}
