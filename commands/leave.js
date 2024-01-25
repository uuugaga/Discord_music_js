const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave the voice channel'),
	async execute(interaction) {
		await music.leave(interaction);
	},
};