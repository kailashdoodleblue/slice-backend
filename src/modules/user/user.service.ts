import { DeepPartial } from "typeorm";
import { User } from "../../entities";
import { AppError } from "../../utils/AppError";
import { CreateUserInput, UpdateUserInput } from "./user.validation";

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return User.find({ order: { id: "DESC" } });
  }

  async getUserById(id: number): Promise<User> {
    const user = await User.findOneBy({ id });
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return user;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const exists = await User.findOneBy({ email: input.email });
    if (exists) {
      throw AppError.conflict("Email already in use");
    }

    const user = User.create(input as DeepPartial<User>);
    return user.save();
  }

  async updateUser(id: number, input: UpdateUserInput): Promise<User> {
    const user = await this.getUserById(id);

    if (input.email && input.email !== user.email) {
      const emailExists = await User.findOneBy({ email: input.email });
      if (emailExists) {
        throw AppError.conflict("Email already in use");
      }
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.email !== undefined) user.email = input.email;

    return user.save();
  }

  async deleteUser(id: number): Promise<void> {
    const result = await User.delete(id);
    if (!result.affected) {
      throw AppError.notFound("User not found");
    }
  }
}

export const userService = new UserService();
