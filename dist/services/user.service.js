/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../entities/user.entity";
const userRepository = AppDataSource.getRepository(User);
export const userService = {
    createUserData: async (userData) => {
        const { email } = userData;
        try {
            const existingUser = await userRepository.findOne({
                where: { email: email },
            });
            if (existingUser) {
                console.log("Conflicting user:", existingUser);
                throw new Error("A user with this email already exists.");
            }
            const user = userRepository.create(userData);
            await userRepository.save(user);
            return user;
        }
        catch (error) {
            if (error instanceof QueryFailedError &&
                error.message.includes("duplicate key")) {
                console.error("Duplicate key error:", error);
                throw new Error("A user with this email already exists.");
            }
            console.error("Error creating user in database:", error);
            throw error;
        }
    },
    getUserByEmail: async (email) => {
        try {
            const user = await userRepository.findOne({
                where: { email },
            });
            return user;
        }
        catch (error) {
            console.error("Error fetching user by email:", error);
            throw error;
        }
    },
};
