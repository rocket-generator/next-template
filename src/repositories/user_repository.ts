import { BaseRepository } from "@/repositories/base_repository";
import { z } from "zod";
import { User, UserSchema } from "@/models/user";
import { APIClient } from "@/libraries/api_client";

export class UserRepository extends BaseRepository<typeof UserSchema> {
  public constructor(accessToken?: string) {
    super(UserSchema, "/admin/users", accessToken);
  }

  async getMe(): Promise<User> {
    const data = await APIClient<User>({
      path: `/me`,
      accessToken: this.accessToken,
    });
    return this.schema.parse(data);
  }
}
