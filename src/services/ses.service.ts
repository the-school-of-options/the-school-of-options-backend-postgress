import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client({ region: process.env.AWS_REGION });

const SENDER = process.env.SES_SENDER_ADDRESS!;
const CONFIG_SET = process.env.SES_CONFIGURATION_SET;

export async function sendSesBulkPlain(
  toEmails: string[],
  subject: string,
  htmlBody: string,
  textBody?: string
) {
  const emailPromises = toEmails.map(async (email) => {
    const command = new SendEmailCommand({
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
