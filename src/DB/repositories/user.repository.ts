import { Model } from "mongoose";
import { Injectable , BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import BaseRepository from "./base.repository";
import { User, UserSchema } from "../models/user.model";
import mongoose from "mongoose";

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectModel(User.name) protected model: Model<User>) {
    super(model);
  }
  async checkUser(email: string): Promise<boolean> {
    const emailExists = await this.findOne({ filter: { email } });
    if (emailExists) {
      throw new BadRequestException("Email already exists");
    }
    return true;
  }
}

// Temporary singleton for old-style middleware files not yet migrated to NestJS DI
// TODO: remove once authentication.ts and auth.gql.ts are converted to NestJS guards
const _UserModel =
  (mongoose.models.User as Model<User>) ||
  mongoose.model<User>("User", UserSchema);

class _UserRepositorySingleton extends BaseRepository<User> {
  constructor() {
    super(_UserModel);
  }
}

export default new _UserRepositorySingleton();
