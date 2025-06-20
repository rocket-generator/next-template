import { UserSchema, transformPrismToModel } from "@/models/user";
import { AuthRepository } from "./auth_repository";

export class UserRepository extends AuthRepository {
  public constructor() {
    super(UserSchema, "user", transformPrismToModel, ["name"]);
  }
}
