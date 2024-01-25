const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Show the status'),
	async execute(interaction) {
		await music.status(interaction);
	},
};