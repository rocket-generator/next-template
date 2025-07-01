import { AuthSchema } from "@/models/auth";
import { z } from "zod";
import { PrismaRepository } from "./prisma_repository";
import { auth } from "@/libraries/auth";
import { BaseRepositoryInterface } from "./base_repository";

export interface AuthRepositoryInterface
  extends BaseRepositoryInterface<typeof AuthSchema> {
  getMe(): Promise<z.infer<typeof AuthSchema>>;
}

export abstract class AuthRepository
  extends PrismaRepository<typeof AuthSchema>
  implements AuthRepositoryInterface
{
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
