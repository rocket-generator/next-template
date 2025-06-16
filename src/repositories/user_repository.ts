import { User, UserSchema, transformPrismToModel } from "@/models/user";
import { AuthRepository } from "./auth_repository";
import { auth } from "@/libraries/auth";

export class UserRepository extends AuthRepository {
  public constructor() {
    super(UserSchema, "user", transformPrismToModel, ["name"]);
  }

  async getMe(): Promise<User> {
    const session = await auth();
    if (!session || !session?.user?.id) {
      throw new Error("Unauthorized");
    }
    return this.findById(session.user.id);
  }
}
