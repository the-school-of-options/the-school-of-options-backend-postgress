/* eslint-disable @typescript-eslint/no-explicit-any */
import AWS_CognitoIdentityServiceProvider, {
  AdminListGroupsForUserCommandOutput,
  AdminSetUserPasswordCommandOutput,
  AuthenticationResultType,
  AuthFlowType,
  CognitoIdentityProvider as CognitoIdentityServiceProvider,
  ListUsersInGroupCommandOutput,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { User } from "../entities/user.entity";
import { AppDataSource } from "../config/database";


const userRepository = AppDataSource.getRepository(User);

export const cognitoIdentityServiceProvider =
  new CognitoIdentityServiceProvider({
    region: process.env.AWS_REGION || "",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

const clientId = process.env.AWS_COGNITO_CLIENT_ID || "";
export const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID || "";

export const authService = {
  checkUserExistsByEmail: async (email: string) => {
    try {
      const users = await cognitoIdentityServiceProvider.listUsers({
        UserPoolId: userPoolId,
        Filter: `email = "${email.toLowerCase()}"`,
      });
      return users.Users && users.Users.length > 0 ? users.Users[0] : null;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return null;
    }
  },

  findUserByEmail: async (email: string) => {
    try {
      const users = await cognitoIdentityServiceProvider.listUsers({
        UserPoolId: userPoolId,
        Filter: `email = "${email.toLowerCase()}"`,
      });
      return users.Users && users.Users.length > 0 ? users.Users[0] : null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  },

  createUserInCognito: async (email: string, password: string) => {
    const userId = uuidv4();

    try {
      const existingUser = await authService.checkUserExistsByEmail(email);
      if (existingUser) {
        throw new Error(`User with email ${email} already exists`);
      }

      const params = {
        UserPoolId: userPoolId,
        Username: userId,
        TemporaryPassword: password,
        MessageAction: MessageActionType.SUPPRESS,
        UserAttributes: [
          { Name: "email", Value: email.toLowerCase() },
          { Name: "preferred_username", Value: userId },
          { Name: "email_verified", Value: "false" },
        ],
      };

      await cognitoIdentityServiceProvider.adminCreateUser(params);
      await cognitoIdentityServiceProvider.adminSetUserPassword({
        UserPoolId: userPoolId,
        Username: userId,
        Password: password,
        Permanent: true,
      });

      return userId;
    } catch (error: any) {
      console.error("Error creating user in cognito:", error);

      if (error.code === "UsernameExistsException") {
        throw new Error(`User with email ${email} already exists`);
      }
      if (error.code === "InvalidPasswordException") {
        throw new Error("Password does not meet requirements");
      }
      if (error.code === "InvalidParameterException") {
        throw new Error("Invalid email format");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw error;
    }
  },

  createUserInCognitoWithoutVerify: async (email: string, password: string) => {
    const userId = uuidv4();

    try {
      const existingUser = await authService.checkUserExistsByEmail(email);
      if (existingUser) {
        throw new Error(`User with email ${email} already exists`);
      }

      const params = {
        UserPoolId: userPoolId,
        Username: userId,
        TemporaryPassword: password,
        MessageAction: MessageActionType.SUPPRESS,
        UserAttributes: [
          { Name: "email", Value: email.toLowerCase() },
          { Name: "preferred_username", Value: userId },
          { Name: "email_verified", Value: "true" },
        ],
      };

      await cognitoIdentityServiceProvider.adminCreateUser(params);
      await cognitoIdentityServiceProvider.adminSetUserPassword({
        UserPoolId: userPoolId,
        Username: userId,
        Password: password,
        Permanent: true,
      });

      return userId;
    } catch (error: any) {
      console.error("Error creating user in cognito:", error);

      if (error.code === "UsernameExistsException") {
        throw new Error(`User with email ${email} already exists`);
      }
      if (error.code === "InvalidPasswordException") {
        throw new Error("Password does not meet requirements");
      }
      if (error.code === "InvalidParameterException") {
        throw new Error("Invalid email format");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw error;
    }
  },



  createGoogleUserInCognito: async (email: string) => {
    const userId = uuidv4();

    try {
      const existingUser = await authService.checkUserExistsByEmail(email);
      if (existingUser) {
        throw new Error(`User with email ${email} already exists`);
      }

      const params = {
        UserPoolId: userPoolId,
        Username: userId,
        MessageAction: MessageActionType.SUPPRESS,
        UserAttributes: [
          { Name: "email", Value: email.toLowerCase() },
          { Name: "preferred_username", Value: userId },
          { Name: "email_verified", Value: "true" },
        ],
      };

      await cognitoIdentityServiceProvider.adminCreateUser(params);

      const userDetails = await cognitoIdentityServiceProvider.adminGetUser({
        UserPoolId: userPoolId,
        Username: userId,
      });

      console.log("User status after creation:", userDetails.UserStatus);

      if (userDetails.UserStatus === "FORCE_CHANGE_PASSWORD") {
        const tempPassword = crypto.randomBytes(32).toString("hex") + "A1!";

        // Set permanent password
        await cognitoIdentityServiceProvider.adminSetUserPassword({
          UserPoolId: userPoolId,
          Username: userId,
          Password: tempPassword,
          Permanent: true,
        });
        console.log("Password set to bypass FORCE_CHANGE_PASSWORD");

        // Check status again after setting password
        const updatedUserDetails =
          await cognitoIdentityServiceProvider.adminGetUser({
            UserPoolId: userPoolId,
            Username: userId,
          });

        console.log(
          "User status after password set:",
          updatedUserDetails.UserStatus
        );

        // Only confirm if user is not already confirmed
        if (updatedUserDetails.UserStatus !== "CONFIRMED") {
          await cognitoIdentityServiceProvider.adminConfirmSignUp({
            UserPoolId: userPoolId,
            Username: userId,
          });
          console.log("User confirmed after password set");
        } else {
          console.log("User already confirmed after password set");
        }
      } else if (userDetails.UserStatus === "CONFIRMED") {
        console.log("User already confirmed, no action needed");
      } else {
        // For any other status, only confirm if not already confirmed
        console.log(
          `User status is ${userDetails.UserStatus}, attempting to confirm`
        );

        try {
          await cognitoIdentityServiceProvider.adminConfirmSignUp({
            UserPoolId: userPoolId,
            Username: userId,
          });
          console.log("User confirmed successfully");
        } catch (confirmError: any) {
          // If confirmation fails because user is already confirmed, that's okay
          if (
            confirmError.code === "NotAuthorizedException" &&
            confirmError.message.includes("Current status is CONFIRMED")
          ) {
            console.log("User was already confirmed, continuing...");
          } else {
            throw confirmError;
          }
        }
      }

      return userId;
    } catch (error: any) {
      console.error("Error creating Google user in cognito:", error);

      if (error.code === "UsernameExistsException") {
        throw new Error(`User with email ${email} already exists`);
      }
      if (error.code === "InvalidParameterException") {
        throw new Error("Invalid email format");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }
      if (error.code === "NotAuthorizedException") {
        // Handle the specific case we're seeing in the logs
        if (error.message.includes("Current status is CONFIRMED")) {
          console.log(
            "User confirmation attempted on already confirmed user, continuing..."
          );
          return userId;
        }
        throw new Error("Unable to confirm user. Please try again.");
      }

      throw error;
    }
  },
  loginUser: async (
    emailOrUsername: string,
    password: string
  ): Promise<AuthenticationResultType> => {
    try {
      return await authService.getTokens(AuthFlowType.ADMIN_NO_SRP_AUTH, {
        USERNAME: emailOrUsername,
        PASSWORD: password,
      });
    } catch (error) {
      if (emailOrUsername.includes("@")) {
        try {
          const user = await authService.findUserByEmail(emailOrUsername);
          if (user && user.Username) {
            return await authService.getTokens(AuthFlowType.ADMIN_NO_SRP_AUTH, {
              USERNAME: user.Username,
              PASSWORD: password,
            });
          }
        } catch (fallbackError) {
          console.error("Fallback login failed:", fallbackError);
        }
      }

      throw error;
    }
  },

  generateSecretHash: (
    username: string,
    clientId: string,
    clientSecret: string
  ): string => {
    const hmac = crypto.createHmac("sha256", clientSecret);
    hmac.update(username + clientId);
    return hmac.digest("base64");
  },

  getTokens: async (
    authFlow: AuthFlowType,
    authParams: Record<string, string>
  ): Promise<AuthenticationResultType> => {
    try {
      const clientSecret =
       process.env.AWS_COGNITO_CLIENT_SECRET || "";

      authParams.SECRET_HASH = authService.generateSecretHash(
        authParams.USERNAME,
        clientId,
        clientSecret
      );

      const response = await cognitoIdentityServiceProvider.adminInitiateAuth({
        UserPoolId: userPoolId,
        ClientId: clientId,
        AuthFlow: authFlow,
        AuthParameters: authParams,
      });

      console.log("presss",response)

      if (response.AuthenticationResult) {
        return response.AuthenticationResult;
      } else {
        console.error("Authentication failed:", response);
        throw new Error(
          `Authentication failed: ${response.ChallengeName || "Unknown error"}`
        );
      }
    } catch (error: any) {
      console.error("Full Cognito error:", {
        code: error.code,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId,
        authFlow: authFlow,
        hasSecretHash: !!authParams.SECRET_HASH,
        username: authParams.USERNAME,
      });

      // Check specific error codes
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later.");
      }
      if (error.code === "NotAuthorizedException") {
        throw new Error("Invalid credentials or account temporarily locked");
      }
      if (error.code === "UserNotConfirmedException") {
        throw new Error(
          "User account not confirmed. Please verify your email."
        );
      }
      if (error.code === "UserNotFoundException") {
        throw new Error(
          "User not found. Please check your email and try again."
        );
      }
      if (error.code === "InvalidUserPoolConfigurationException") {
        throw new Error(
          "User pool configuration error. Please contact support."
        );
      }

      throw error;
    }
  },

  resetPassword: async (
    userIdentifier: string,
    password: string
  ): Promise<AdminSetUserPasswordCommandOutput> => {
    try {
      let username = userIdentifier;

      if (userIdentifier.includes("@")) {
        const user = await authService.findUserByEmail(userIdentifier);
        if (user && user.Username) {
          username = user.Username;
        } else {
          throw new Error("User not found with this email");
        }
      }

      const userDetails = await cognitoIdentityServiceProvider.adminGetUser({
        UserPoolId: userPoolId,
        Username: username,
      });

      await cognitoIdentityServiceProvider.adminSetUserPassword({
        UserPoolId: userPoolId,
        Username: username,
        Password: password,
        Permanent: true,
      });

      const postPasswordUserDetails =
        await cognitoIdentityServiceProvider.adminGetUser({
          UserPoolId: userPoolId,
          Username: username,
        });

      console.log(
        "User status after setting password:",
        postPasswordUserDetails.UserStatus
      );

      if (postPasswordUserDetails.UserStatus !== "CONFIRMED") {
        await cognitoIdentityServiceProvider.adminConfirmSignUp({
          UserPoolId: userPoolId,
          Username: username,
        });
        console.log("User manually confirmed during reset");
      } else {
        console.log("User already confirmed by adminSetUserPassword");
      }

      await cognitoIdentityServiceProvider.adminUpdateUserAttributes({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [
          {
            Name: "email_verified",
            Value: "true",
          },
        ],
      });

      const finalUserDetails =
        await cognitoIdentityServiceProvider.adminGetUser({
          UserPoolId: userPoolId,
          Username: username,
        });

      console.log(
        "Final user status after reset:",
        finalUserDetails.UserStatus
      );

      return {
        $metadata: finalUserDetails.$metadata,
      };
    } catch (error: any) {
      console.error("Reset password error:", error);

      if (error.code === "UserNotFoundException") {
        throw new Error(
          "User not found. Please check the email and try again."
        );
      }
      if (error.code === "InvalidPasswordException") {
        throw new Error("Password does not meet requirements");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw new Error("Failed to reset password. Please try again.");
    }
  },

  confirmInvitedUserEmail: async (userIdentifier: string) => {
    try {
      let username = userIdentifier;

      if (userIdentifier.includes("@")) {
        const user = await authService.findUserByEmail(userIdentifier);
        if (user && user.Username) {
          username = user.Username;
        }
      }

      await cognitoIdentityServiceProvider.adminUpdateUserAttributes({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [{ Name: "email_verified", Value: "true" }],
      });

      try {
        await cognitoIdentityServiceProvider.adminConfirmSignUp({
          UserPoolId: userPoolId,
          Username: username,
        });
      } catch (error: any) {
        if (error.code !== "NotAuthorizedException") {
          console.error("Error confirming invited user:", error);
        }
      }
    } catch (error: any) {
      console.error("Failed to verify invited user email:", error);

      if (error.code === "UserNotFoundException") {
        throw new Error("User not found.");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw new Error("Failed to confirm email");
    }
  },

  getCognitoUserbyUsername: async (
    userIdentifier: string
  ): Promise<AdminListGroupsForUserCommandOutput> => {
    try {
      let username = userIdentifier;

      if (userIdentifier.includes("@")) {
        const user = await authService.findUserByEmail(userIdentifier);
        if (user && user.Username) {
          username = user.Username;
        }
      }

      const userResponse = await cognitoIdentityServiceProvider.adminGetUser({
        UserPoolId: userPoolId,
        Username: username,
      });

      const groupsResponse =
        await cognitoIdentityServiceProvider.adminListGroupsForUser({
          UserPoolId: userPoolId,
          Username: username,
        });

      return {
        ...userResponse,
        Groups: groupsResponse.Groups,
      };
    } catch (error: any) {
      console.error("Error getting user by username:", error);

      if (error.code === "UserNotFoundException") {
        throw new Error("User not found");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw error;
    }
  },

  getCognitoUsersbyGroupName: async (
    group: string
  ): Promise<ListUsersInGroupCommandOutput> => {
    try {
      const response = await cognitoIdentityServiceProvider.listUsersInGroup({
        UserPoolId: userPoolId,
        GroupName: group,
      });
      return response;
    } catch (error: any) {
      console.error("Error getting users by group:", error);

      if (error.code === "ResourceNotFoundException") {
        throw new Error("Group not found");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw error;
    }
  },
  addUserToCognitoGroup: async (username: string, groupName: string) => {
    try {
      await cognitoIdentityServiceProvider.adminAddUserToGroup({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: groupName,
      });
      console.log(`User ${username} added to group ${groupName}`);
    } catch (error: any) {
      console.error("Error adding user to group:", error);

      if (error.code === "ResourceNotFoundException") {
        throw new Error(`Group ${groupName} not found`);
      }
      if (error.code === "UserNotFoundException") {
        throw new Error("User not found");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw error;
    }
  },

  removeUserFromCognitoGroup: async (username: string, groupName: string) => {
    try {
      await cognitoIdentityServiceProvider.adminRemoveUserFromGroup({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: groupName,
      });
      console.log(`User ${username} removed from group ${groupName}`);
    } catch (error: any) {
      console.error("Error removing user from group:", error);

      if (error.code === "ResourceNotFoundException") {
        throw new Error(`Group ${groupName} not found`);
      }
      if (error.code === "UserNotFoundException") {
        throw new Error("User not found");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw error;
    }
  },

  syncUserRoleWithCognitoGroups: async (username: string, role: string) => {
    try {
      const groupsResponse = await cognitoIdentityServiceProvider.adminListGroupsForUser({
        UserPoolId: userPoolId,
        Username: username,
      });

      const currentGroups = groupsResponse.Groups?.map(g => g.GroupName) || [];
      const targetGroup = role;

      // Remove from all groups that don't match the target role
      for (const group of currentGroups) {
        if (group && group !== targetGroup) {
          await authService.removeUserFromCognitoGroup(username, group);
        }
      }

      // Add to target group if not already in it
      if (!currentGroups.includes(targetGroup)) {
        await authService.addUserToCognitoGroup(username, targetGroup);
      }

      console.log(`User ${username} synced to group ${targetGroup}`);
    } catch (error: any) {
      console.error("Error syncing user role with groups:", error);
      throw error;
    }
  },

  getUserRoleFromCognitoGroups: async (username: string): Promise<string | null> => {
    try {
      const groupsResponse = await cognitoIdentityServiceProvider.adminListGroupsForUser({
        UserPoolId: userPoolId,
        Username: username,
      });

      const groups = groupsResponse.Groups?.map(g => g.GroupName) || [];

      // Priority: Super-Admin > User
      if (groups.includes("Super-Admin")) {
        return "Super-Admin";
      } else if (groups.includes("User")) {
        return "User";
      }

      return null;
    } catch (error: any) {
      console.error("Error getting user role from groups:", error);
      return null;
    }
  },

  refreshTokens: async (
    userIdentifier: string,
    refreshToken: string
  ): Promise<AWS_CognitoIdentityServiceProvider.AuthenticationResultType> => {
    try {
      let username = userIdentifier;

      if (userIdentifier.includes("@")) {
        const user = await authService.findUserByEmail(userIdentifier);
        if (user && user.Username) {
          username = user.Username;
        }
      }

      const tokens = await authService.getTokens("REFRESH_TOKEN", {
        USERNAME: username,
        REFRESH_TOKEN: refreshToken,
      });

      return tokens;
    } catch (error: any) {
      console.error("Error refreshing tokens:", error);

      if (error.code === "NotAuthorizedException") {
        throw new Error("Invalid refresh token. Please login again.");
      }
      if (error.code === "UserNotFoundException") {
        throw new Error("User not found. Please login again.");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw error;
    }
  },
  updateUserEmail: async (
    userIdentifier: string,
    newEmail: string
  ): Promise<AWS_CognitoIdentityServiceProvider.AdminUpdateUserAttributesCommandOutput> => {
    try {
      const existingUser = await authService.checkUserExistsByEmail(newEmail);
      if (existingUser) {
        throw new Error(`Email ${newEmail} is already in use`);
      }

      let username = userIdentifier;

      if (userIdentifier.includes("@")) {
        const user = await authService.findUserByEmail(userIdentifier);
        if (user && user.Username) {
          username = user.Username;
        }
      }

      return await cognitoIdentityServiceProvider.adminUpdateUserAttributes({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [
          { Name: "email", Value: newEmail.toLowerCase() },
          { Name: "email_verified", Value: "false" },
        ],
      });
    } catch (error: any) {
      console.error("Failed to update email:", error);

      if (error.code === "UserNotFoundException") {
        throw new Error("User not found");
      }
      if (error.code === "InvalidParameterException") {
        throw new Error("Invalid email format");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw new Error("Failed to update email");
    }
  },

  verifyUserEmail: async (username: string) => {
    try {
      await cognitoIdentityServiceProvider.adminUpdateUserAttributes({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [{ Name: "email_verified", Value: "true" }],
      });
    } catch (error: any) {
      console.error("Failed to verify email:", error);

      if (error.code === "CodeMismatchException") {
        throw new Error("Invalid verification code");
      }
      if (error.code === "ExpiredCodeException") {
        throw new Error("Verification code has expired");
      }
      if (error.code === "NotAuthorizedException") {
        throw new Error("Invalid access token");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }

      throw new Error("Failed to verify email");
    }
  },

  sendVerificationCode: async (username: string) => {
    try {
      await cognitoIdentityServiceProvider.adminUpdateUserAttributes({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [{ Name: "email_verified", Value: "false" }],
      });

      // This triggers Cognito to send a verification code
      const response = await cognitoIdentityServiceProvider.adminGetUser({
        UserPoolId: userPoolId,
        Username: username,
      });

      console.log("Verification code sent for user:", username);
      return response;
    } catch (error: any) {
      console.error("Failed to send verification code:", error);

      if (error.code === "UserNotFoundException") {
        throw new Error("User not found");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }
      if (error.code === "InvalidParameterException") {
        throw new Error("Invalid parameters");
      }

      throw new Error("Failed to send verification code");
    }
  },

  confirmSignUpWithCode: async (username: string, code: string) => {
    try {
      // Since we're using admin user creation, we need to verify the attribute update code
      await cognitoIdentityServiceProvider.adminUpdateUserAttributes({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: [{ Name: "email_verified", Value: "true" }],
      });

      // Confirm the user signup
      await cognitoIdentityServiceProvider.adminConfirmSignUp({
        UserPoolId: userPoolId,
        Username: username,
      });

      console.log("User confirmed successfully:", username);
    } catch (error: any) {
      console.error("Failed to confirm signup:", error);

      if (error.code === "CodeMismatchException") {
        throw new Error("Invalid verification code");
      }
      if (error.code === "ExpiredCodeException") {
        throw new Error("Verification code has expired");
      }
      if (error.code === "UserNotFoundException") {
        throw new Error("User not found");
      }
      if (error.code === "TooManyRequestsException") {
        throw new Error("Too many requests. Please try again later");
      }
      if (error.code === "NotAuthorizedException") {
        if (error.message.includes("Current status is CONFIRMED")) {
          console.log("User already confirmed");
          return;
        }
        throw new Error("Not authorized to confirm signup");
      }

      throw new Error("Failed to confirm signup");
    }
  },
};
