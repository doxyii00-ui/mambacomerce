import {
  Client,
  Events,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  REST,
  Routes,
} from "discord.js";

const grantAccessCommand = new SlashCommandBuilder()
  .setName("grantaccess")
  .setDescription("[ADMIN] Grant MambaReceipts access to a user")
  .addStringOption((option) =>
    option
      .setName("email")
      .setDescription("Email associated with the purchase")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("orderid")
      .setDescription("Order ID from the purchase")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(0); // No default permissions - must be explicitly set

const revokeAccessCommand = new SlashCommandBuilder()
  .setName("odbierz")
  .setDescription("[ADMIN] Revoke MambaReceipts access from a user")
  .addStringOption((option) =>
    option
      .setName("email")
      .setDescription("Email to revoke access from")
      .setRequired(true)
  )
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("Discord user to remove the role from")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(0);

const nadajDostepCommand = new SlashCommandBuilder()
  .setName("nadajdostep")
  .setDescription("[ADMIN] Przydziel dostęp do MambaReceipts użytkownikowi")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("Discord user do przydzielenia dostępu")
      .setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("dni")
      .setDescription("Ilość dni dostępu")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(999)
  )
  .setDefaultMemberPermissions(0);

const polaczCommand = new SlashCommandBuilder()
  .setName("polacz")
  .setDescription("Połącz swój email z Discordem aby otrzymać dostęp do MambaReceipts")
  .addStringOption((option) =>
    option
      .setName("email")
      .setDescription("Twój email z zakupem MambaReceipts")
      .setRequired(true)
  );

export async function registerDiscordCommands(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "nadajdostep") {
      const user = interaction.options.getUser("user");
      const days = interaction.options.getInteger("dni") ?? 31;
      const userId = user?.id;

      if (!userId || !user) {
        await interaction.reply({
          content: `❌ Błąd: nie mogę znaleźć użytkownika!`,
          ephemeral: true,
        });
        return;
      }

      try {
        const { storage } = await import("./storage");
        
        // Create Discord access entry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        const email = `admin-${userId}@mamba.local`;
        
        await storage.grantDiscordAccess({
          email: email,
          discordUserId: userId,
          expiresAt: expiresAt,
        });

        // Add role
        const roleId = process.env.DISCORD_ROLE_ID;
        if (roleId && interaction.guildId) {
          const guild = await interaction.client.guilds.fetch(interaction.guildId);
          const member = await guild.members.fetch(userId);
          await member.roles.add(roleId);
        }

        const expiryDate = expiresAt.toLocaleDateString("pl-PL");
        await interaction.reply({
          content: `✅ Przydzielono dostęp użytkownikowi ${user.tag}!\n📅 Wygasa: **${expiryDate}**`,
          ephemeral: true,
        });
      } catch (error: any) {
        console.error("[Discord] Error in /nadajdostep command:", error);
        await interaction.reply({
          content: "❌ Błąd podczas przydzielania dostępu!",
          ephemeral: true,
        });
      }
    }

    if (interaction.commandName === "polacz") {
      const email = interaction.options.getString("email") ?? "";
      const userId = interaction.user.id;
      const guildId = interaction.guildId;

      try {
        const { storage } = await import("./storage");
        const discordAccess = await storage.getDiscordAccess(email.toLowerCase());

        if (!discordAccess) {
          await interaction.reply({
            content: `❌ Email \`${email}\` nie ma dostępu do MambaReceipts!`,
            ephemeral: true,
          });
          return;
        }

        // Check if email is already connected to different Discord user
        if (discordAccess.discordUserId && discordAccess.discordUserId !== "pending" && discordAccess.discordUserId !== userId) {
          await interaction.reply({
            content: `❌ Ten email został już połączony z innym konta Discord! Każdy zakup można używać tylko raz.`,
            ephemeral: true,
          });
          return;
        }

        if (new Date() > discordAccess.expiresAt) {
          await interaction.reply({
            content: `⏰ Twój dostęp wygasł ${discordAccess.expiresAt.toLocaleDateString("pl-PL")}`,
            ephemeral: true,
          });
          return;
        }

        await storage.updateDiscordUserId(email.toLowerCase(), userId);

        const roleId = process.env.DISCORD_ROLE_ID;
        if (roleId && guildId) {
          const guild = await interaction.client.guilds.fetch(guildId);
          const member = await guild.members.fetch(userId);
          await member.roles.add(roleId);
        }

        const expiryDate = discordAccess.expiresAt.toLocaleDateString("pl-PL");
        await interaction.reply({
          content: `✅ Połączono! Twój dostęp wygasa: **${expiryDate}**`,
          ephemeral: true,
        });
      } catch (error: any) {
        console.error("[Discord] Error in /polacz command:", error);
        await interaction.reply({
          content: "❌ Błąd podczas łączenia. Spróbuj ponownie!",
          ephemeral: true,
        });
      }
    }

    if (interaction.commandName === "grantaccess") {
      const email = interaction.options.getString("email");
      const orderId = interaction.options.getString("orderid");

      // Create a modal for additional info
      const modal = new ModalBuilder()
        .setCustomId(`grantaccess_modal_${interaction.user.id}`)
        .setTitle("MambaReceipts Access Request");

      const emailInput = new TextInputBuilder()
        .setCustomId("email_input")
        .setLabel("Purchase Email")
        .setStyle(TextInputStyle.Short)
        .setValue(email || "")
        .setRequired(true);

      const orderInput = new TextInputBuilder()
        .setCustomId("order_input")
        .setLabel("Order ID")
        .setStyle(TextInputStyle.Short)
        .setValue(orderId || "")
        .setRequired(true);

      const discordNickInput = new TextInputBuilder()
        .setCustomId("discord_nick")
        .setLabel("Your Discord Username")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g., YourUsername#1234")
        .setRequired(true);

      const firstActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
      const secondActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(orderInput);
      const thirdActionRow =
        new ActionRowBuilder<TextInputBuilder>().addComponents(discordNickInput);

      modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

      await interaction.showModal(modal);
    }

    if (interaction.commandName === "odbierz") {
      await interaction.deferReply({ ephemeral: true });

      try {
        const email = interaction.options.getString("email");
        const user = interaction.options.getUser("user");

        if (!email || !user) {
          await interaction.editReply({
            content: "❌ Email and user are required",
          });
          return;
        }

        // Call the revoke access API
        const response = await fetch(
          `${process.env.API_BASE_URL || "http://localhost:5000"}/api/discord/revoke-access`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase(),
              discordUserId: user.id,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          await interaction.editReply({
            content: `❌ Error revoking access: ${error.error}`,
          });
          return;
        }

        await interaction.editReply({
          content: `✅ Access revoked for ${user.tag} (${email})`,
        });
      } catch (error: any) {
        console.error("Revoke access error:", error);
        await interaction.editReply({
          content: `❌ Error processing your request: ${error.message}`,
        });
      }
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId.startsWith("grantaccess_modal_")) {
      await interaction.deferReply({ ephemeral: true });

      try {
        const email = interaction.fields.getTextInputValue("email_input");
        const orderId = interaction.fields.getTextInputValue("order_input");
        const discordNick = interaction.fields.getTextInputValue("discord_nick");

        // Determine duration based on order (this should be fetched from API ideally)
        // For now, default to 31 days for monthly, could be enhanced with API call
        const durationDays = 31; // You can make this dynamic based on the order type

        // Call the grant access API
        const response = await fetch(
          `${process.env.API_BASE_URL || "http://localhost:5000"}/api/discord/grant-access`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase(),
              discordUserId: interaction.user.id,
              orderId,
              durationDays,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          await interaction.editReply({
            content: `❌ Error granting access: ${error.error}`,
          });
          return;
        }

        const result = await response.json();

        await interaction.editReply({
          content: `✅ Access granted! Your MambaReceipts access is active until ${new Date(result.expiresAt).toLocaleDateString()}. Check your roles!`,
        });
      } catch (error: any) {
        console.error("Grant access error:", error);
        await interaction.editReply({
          content: `❌ Error processing your request: ${error.message}`,
        });
      }
    }
  });
}

export async function registerSlashCommands(
  token: string,
  clientId: string,
  guildId: string
) {
  try {
    const rest = new REST().setToken(token);

    console.log("Registering slash commands...");

    const commands = [grantAccessCommand.toJSON(), revokeAccessCommand.toJSON(), nadajDostepCommand.toJSON(), polaczCommand.toJSON()];

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully registered slash commands: /grantaccess, /odbierz, /nadajdostep, /polacz");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
}
