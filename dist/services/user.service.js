"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const typeorm_1 = require("typeorm");
const database_1 = require("../config/database");
const user_entity_1 = require("../entities/user.entity");
const userRepository = database_1.AppDataSource.getRepository(user_entity_1.User);
exports.userService = {
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
            if (error instanceof typeorm_1.QueryFailedError &&
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
