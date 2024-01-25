const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isButton()) {

			const command = interaction.client.commands.get(interaction.customId);

			if (!command) {
				console.error(`No command matching ${interaction.customId} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.customId}`);
				console.error(error);
			}
		}
	},
};