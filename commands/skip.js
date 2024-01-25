const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the music'),
	async execute(interaction) {
		await music.skip(interaction);
	},
};