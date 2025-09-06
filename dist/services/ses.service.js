"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSesBulkPlain = sendSesBulkPlain;
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const client = new client_sesv2_1.SESv2Client({ region: process.env.AWS_REGION });
const SENDER = process.env.SES_SENDER_ADDRESS;
const CONFIG_SET = process.env.SES_CONFIGURATION_SET;
async function sendSesBulkPlain(toEmails, subject, htmlBody, textBody) {
    const emailPromises = toEmails.map(async (email) => {
        const command = new client_sesv2_1.SendEmailCommand({
            FromEmailAddress: SENDER,
            Destination: {
                ToAddresses: [email],
            },
            Content: {
                Simple: {
                    Subject: { Data: subject },
                    Body: {
                        Html: { Data: htmlBody },
                        Text: textBody ? { Data: textBody } : undefined,
                    },
                },
            },
            ConfigurationSetName: CONFIG_SET,
        });
        return client.send(command);
    });
    const results = await Promise.allSettled(emailPromises);
    return {
        successful: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
        results,
    };
}
