const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loop')
		.setDescription('Loop the song'),
	async execute(interaction) {
		await music.loop(interaction);
	},
};