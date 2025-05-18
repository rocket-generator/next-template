import { LocalRepository } from "@/repositories/local_repository";
import { User, UserSchema } from "@/models/user";

export class UserRepository extends LocalRepository<typeof UserSchema> {
  public constructor(accessToken?: string) {
    super(
      UserSchema,
      "/app/users",
      {
        directory: "public/data/users",
      },
      accessToken
    );
  }

  async getMe(): Promise<User> {
    return this.findById("prototype-admin");
  }

  // getMePrototype is no longer needed as getMe now uses local file
}
