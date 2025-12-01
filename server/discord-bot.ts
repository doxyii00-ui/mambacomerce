import { Client, GatewayIntentBits } from "discord.js";

let connectionSettings: any;
let cachedClient: Client | null = null;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    console.error("X_REPLIT_TOKEN not found");
    return null;
  }

  try {
    connectionSettings = await fetch(
      "https://" +
        hostname +
        "/api/v2/connection?include_secrets=true&connector_names=discord",
      {
        headers: {
          Accept: "application/json",
          X_REPLIT_TOKEN: xReplitToken,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => data.items?.[0]);

    const accessToken =
      connectionSettings?.settings?.access_token ||
      connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
      console.error("Discord not properly configured");
      return null;
    }
    return accessToken;
  } catch (error) {
    console.error("Error getting Discord token:", error);
    return null;
  }
}

export async function getDiscordClient() {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.error("No Discord token available");
      return null;
    }

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
      ],
    });

    await client.login(token);
    return client;
  } catch (error) {
    console.error("Error creating Discord client:", error);
    return null;
  }
}

export async function grantDiscordRole(
  userId: string,
  guildId: string,
  roleId: string
): Promise<boolean> {
  try {
    const client = await getDiscordClient();
    if (!client) {
      console.error("Discord client not available");
      return false;
    }

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);

    await client.destroy();
    return true;
  } catch (error) {
    console.error("Error granting Discord role:", error);
    return false;
  }
}

export async function removeDiscordRole(
  userId: string,
  guildId: string,
  roleId: string
): Promise<boolean> {
  try {
    const client = await getDiscordClient();
    if (!client) {
      console.error("Discord client not available");
      return false;
    }

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    await member.roles.remove(roleId);

    await client.destroy();
    return true;
  } catch (error) {
    console.error("Error removing Discord role:", error);
    return false;
  }
}
