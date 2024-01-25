const { Events } = require('discord.js');
const music = require('../commands/utility/music');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isStringSelectMenu()) {

			try {
                music.playUrl(interaction, interaction.values[0]);
			} catch (error) {
				console.error(`Error executing ${interaction.customId}`);
				console.error(error);
			}
		}
	},
};