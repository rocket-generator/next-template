import { User, UserSchema, transformPrismToModel } from "@/models/user";
import { PrismaRepository } from "./prisma_repository";
import { auth } from "@/libraries/auth";

export class UserRepository extends PrismaRepository<typeof UserSchema> {
  public constructor() {
    super(UserSchema, "/app/users", transformPrismToModel);
  }

  async getMe(): Promise<User> {
    const session = await auth();
    if (!session || !session?.user?.id) {
      throw new Error("Unauthorized");
    }
    return this.findById(session.user.id);
  }

  // getMePrototype is no longer needed as getMe now uses local file
}
