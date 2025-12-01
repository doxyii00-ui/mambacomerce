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
  .setDescription("Request MambaReceipts access")
  .addStringOption((option) =>
    option
      .setName("email")
      .setDescription("Email associated with your purchase")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("orderid")
      .setDescription("Your order ID from the purchase")
      .setRequired(true)
  );

export async function registerDiscordCommands(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

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

    const commands = [grantAccessCommand.toJSON()];

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Successfully registered slash commands");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
}
