const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('recommend')
		.setDescription('Bot will play a song recommended if queue is empty'),
	async execute(interaction) {
		await music.recommend(interaction);
	},
};