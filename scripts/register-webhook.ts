import * as dotenv from "dotenv";
import { resolve } from "path";
import { IDL } from "../packages/sdk/src";

dotenv.config({ path: resolve(__dirname, "../.env") });

async function registerWebhook() {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    console.error("❌ HELIUS_API_KEY is missing from .env");
    process.exit(1);
  }

  // Determine the webhook URL. 
  // In development, you should use ngrok (e.g. NGROK_URL in .env)
  // In production, use the actual domain.
  let webhookUrl = process.env.WEBHOOK_URL || process.env.NGROK_URL;
  if (!webhookUrl) {
    console.error("❌ WEBHOOK_URL or NGROK_URL is required to register a webhook.");
    console.error("   Example: NGROK_URL=https://1234.ngrok-free.app");
    process.exit(1);
  }

  // Ensure url ends correctly
  webhookUrl = webhookUrl.replace(/\/$/, "") + "/webhook/helius";
  const programId = IDL.address;

  console.log(`Registering Helius Webhook...`);
  console.log(`- Webhook URL: ${webhookUrl}`);
  console.log(`- Program ID: ${programId}`);

  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookURL: webhookUrl,
          transactionTypes: ["ANY"],
          accountAddresses: [programId],
          webhookType: "enhanced",
          authHeader: apiKey // We use the API Key as the auth header to verify incoming requests
        }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      console.log("✅ Webhook registered successfully!");
      console.log("Webhook ID:", data.webhookID);
    } else {
      console.error("❌ Failed to register webhook:", data);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

registerWebhook();
