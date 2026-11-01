import { Request, Response } from "express";
import { userService } from "./user.service";
import { sendResponse } from "../../utils/response";

export class UserController {
  getUsers = async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    return sendResponse(res, {
      message: "Users retrieved successfully",
      data: users,
    });
  };

  getUserById = async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params.id);
    return sendResponse(res, {
      message: "User retrieved successfully",
      data: user,
    });
  };

  createUser = async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    return sendResponse(res, {
      statusCode: 201,
      message: "User created successfully",
      data: user,
    });
  };

  updateUser = async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id, req.body);
    return sendResponse(res, {
      message: "User updated successfully",
      data: user,
    });
  };

  deleteUser = async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id);
    return sendResponse(res, {
      message: "User deleted successfully",
    });
  };
}

export const userController = new UserController();
