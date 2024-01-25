const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume the music'),
	async execute(interaction) {
		await music.resume(interaction);
		// await interaction.reply('Resume the music');
	},
};