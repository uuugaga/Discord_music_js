const { SlashCommandBuilder } = require('discord.js');
const music = require('./utility/music');

module.exports = {
    data: new SlashCommandBuilder() // 建立指令的 function
        .setName('play')            // 指令名稱
        .setDescription('播放音樂')  // 指令描述
        .addStringOption(option =>  // 增加 option
            option
                .setName('url')                          // option name
                .setDescription('提供 Youtube url 網址')  // option 描述
                .setRequired(true)                       // option 是否為必要 (如果為必要，輸入指令時會自動帶入)
        ),
    async execute(interaction) {
        // 使用者輸入指令後程式要做的事
        await music.play(interaction);
    },
};