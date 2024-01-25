const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
    data: new SlashCommandBuilder() // 建立指令的 function
        .setName('play')            // 指令名稱
        .setDescription('play music')  // 指令描述
        .addStringOption(option =>  // 增加 option
            option
                .setName('play_input')                          
                .setDescription('Youtube url')  
                .setRequired(true)                       
        ),
    async execute(interaction) {
        await music.play(interaction);
    },
};