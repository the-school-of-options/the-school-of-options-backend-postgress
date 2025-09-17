"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupEmailTemplates = exports.AWSUtils = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const client_ses_1 = require("@aws-sdk/client-ses");
const emailTemplates_1 = require("../constants/emailTemplates");
const ses = new client_ses_1.SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.AWSUtils = {
    createTemplate: async (templateConfig) => {
        try {
            const command = new client_ses_1.CreateTemplateCommand({
                Template: templateConfig,
            });
            await ses.send(command);
            console.log(`✅ Template '${templateConfig.TemplateName}' created successfully`);
            return true;
        }
        catch (error) {
            if (error.name === "AlreadyExistsException") {
                console.log(`⚠️ Template '${templateConfig.TemplateName}' already exists`);
                return true;
            }
            console.error(`❌ Error creating template '${templateConfig.TemplateName}':`, error.message);
            return false;
        }
    },
    updateTemplate: async (templateConfig) => {
        try {
            const command = new client_ses_1.UpdateTemplateCommand({
                Template: templateConfig,
            });
            await ses.send(command);
            console.log(`✅ Template '${templateConfig.TemplateName}' updated successfully`);
            return true;
        }
        catch (error) {
            console.error(`❌ Error updating template '${templateConfig.TemplateName}':`, error.message);
            return false;
        }
    },
    initializeTemplates: async () => {
        console.log("🚀 Initializing email templates...");
        const templates = Object.values(emailTemplates_1.EMAIL_TEMPLATES);
        const results = [];
        for (const template of templates) {
            const created = await exports.AWSUtils.createTemplate(template);
            results.push({ name: template.TemplateName, success: created });
        }
        const successCount = results.filter((r) => r.success).length;
        console.log(`✅ Templates initialized: ${successCount}/${results.length} successful`);
        return results;
    },
    listTemplates: async () => {
        try {
            const command = new client_ses_1.ListTemplatesCommand({});
            const response = await ses.send(command);
            console.log("📋 Existing templates:", response.TemplatesMetadata?.map((t) => t.Name));
            return response.TemplatesMetadata || [];
        }
        catch (error) {
            console.error("❌ Error listing templates:", error.message);
            return [];
        }
    },
    deleteTemplate: async (templateName) => {
        try {
            const command = new client_ses_1.DeleteTemplateCommand({
                TemplateName: templateName,
            });
            await ses.send(command);
            console.log(`✅ Template '${templateName}' deleted successfully`);
            return true;
        }
        catch (error) {
            console.error(`❌ Error deleting template '${templateName}':`, error.message);
            return false;
        }
    },
    sendEmail: async (from, to, templateName, templateData) => {
        if (!validateEmail(from)) {
            throw new Error(`Invalid 'from' email address: ${from}`);
        }
        const invalidEmails = to.filter((email) => !validateEmail(email));
        if (invalidEmails.length > 0) {
            throw new Error(`Invalid 'to' email address(es): ${invalidEmails.join(", ")}`);
        }
        try {
            const params = {
                Source: from,
                Destination: {
                    ToAddresses: to,
                },
                Template: templateName,
                TemplateData: JSON.stringify(templateData),
            };
            const command = new client_ses_1.SendTemplatedEmailCommand(params);
            const response = await ses.send(command);
            console.log(`✅ Email sent successfully using template '${templateName}'. MessageId: ${response.MessageId}`);
            return response.MessageId;
        }
        catch (error) {
            console.error("❌ Error sending email:", error.message);
            if (error.message.includes("Email address not verified")) {
                throw new Error("Email address not verified in AWS SES. Please verify your domain or email address in the AWS SES console.");
            }
            if (error.message.includes("Template") &&
                error.message.includes("does not exist")) {
                throw new Error(`Email template '${templateName}' does not exist. Please create the template first using AWSUtils.createTemplate()`);
            }
            throw error;
        }
    },
};
const setupEmailTemplates = async () => {
    console.log("🔧 Setting up email templates for TheSchoolOfOptions...");
    await exports.AWSUtils.initializeTemplates();
    await exports.AWSUtils.listTemplates();
    console.log("✅ Email template setup complete!");
};
exports.setupEmailTemplates = setupEmailTemplates;
