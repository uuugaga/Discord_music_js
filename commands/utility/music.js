const play = require('play-dl');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder } = require('discord.js');

class Music {

    constructor() {
        this.isPlaying = {};
        this.queue = {};
        this.connection = {};
        this.dispatcher = {};
    }

    command(interaction) {
        interaction.reply({ content: `【播放音樂】/play url:音樂網址\n【暫停播放】/pause\n【恢復播放】/resume\n【跳過這首歌曲】/skip\n【查看歌曲隊列】/queue\n【刪除播放清單中的所有歌曲】/deleteplaylist id:id\n【查看機器人指令】/command\n【讓機器人離開語音頻道（會清空歌曲隊列）】/leave` });
    }

    isPlayList(url) {
        if (url.indexOf('&list') > -1 && url.indexOf('music.youtube') < 0) {
            return true;
        }

        return false;
    }

    async play(interaction) {
        const guildID = interaction.guildId;

        const confirm = new ButtonBuilder()
          .setCustomId('confirm')
          .setLabel('Confirm Ban')
          .setStyle(ButtonStyle.Danger);

        const cancel = new ButtonBuilder()
          .setCustomId('cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary);

        const select = new UserSelectMenuBuilder()
          .setCustomId('users')
          .setPlaceholder('Select multiple users.')
          .setMinValues(1)
          .setMaxValues(10);

        const row = new ActionRowBuilder()
          .addComponents(cancel, confirm);
        
        const row2 = new ActionRowBuilder()
          .addComponents(select);


        if (interaction.member.voice.channel === null) {
            interaction.reply({ content: 'Please join the voice channel first.', ephemeral: true });
            return;
        }

        this.connection[guildID] = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: guildID,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        let musicURL = interaction.options.getString('url').trim();

        try {
            if (!this.queue[guildID]) {
                this.queue[guildID] = [];
            }

            let musicName = null;

            const isPlayList = this.isPlayList(musicURL);
            if (isPlayList) {

                const res = await play.playlist_info(musicURL);
                musicName = res.title;

                const videoTitles = res.videos.map((v, i) => `[${i+1}] ${v.title}`).slice(0, 10).join('\n');
                interaction.channel.send(`**加入播放清單：${musicName}**\nID 識別碼：[${res.id}]\n==========================\n${videoTitles}\n……以及其他 ${res.videos.length - 10} 首歌 `);

                res.videos.forEach(v => {
                    this.queue[guildID].push({
                        id: res.id,
                        name: v.title,
                        url: v.url
                    });
                });

            } else {

                const res = await play.video_basic_info(musicURL);
                musicName = res.video_details.title;

                this.queue[guildID].push({
                    id: res.video_details.id,
                    name: musicName,
                    url: musicURL
                });

            }

            if (this.isPlaying[guildID]) {
                interaction.reply({ content: `歌曲加入隊列：${musicName}`, components: [row, row2]});
            } else {
                this.isPlaying[guildID] = true;
                interaction.reply({ content: `🎵　播放音樂：${this.queue[guildID][0].name}`, components: [row, row2]});
                this.playMusic(interaction, this.queue[guildID][0], true);
            }

        } catch(e) {
            console.log(e);
            interaction.reply({ content: '發生錯誤 :('});
        }
    }

    playNextMusic(interaction) {

        const guildID = interaction.guildId;

        if (this.queue[guildID].length > 0) {
            this.playMusic(interaction, this.queue[guildID][0], false);
        } else {
            this.isPlaying[guildID] = false;
        }
    }

    async playMusic(interaction, musicInfo, isReplied) {

        const guildID = interaction.guildId;

        try {

            if (!isReplied) {
                const content = `🎵　播放音樂：${musicInfo.name}`;
                interaction.channel.send(content);
            }
            
            const stream = await play.stream(musicInfo.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            });

            player.play(resource);

            this.connection[guildID].subscribe(player);
            this.dispatcher[guildID] = player;

            this.queue[guildID].shift();

            player.on('stateChange', (oldState, newState) => {

                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    this.playNextMusic(interaction);
                }

            });
        } catch(e) {
            console.log(e);
            interaction.channel.send('歌曲發生錯誤...');

            this.queue[guildID].shift();

            this.playNextMusic(interaction);
        }

    }

    resume(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].unpause();
            interaction.reply({ content: '恢復播放' });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    pause(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].pause();
            interaction.reply({ content: '暫停播放' });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    skip(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].stop();
            interaction.reply({ content: '跳過目前歌曲' });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    nowQueue(interaction) {

        const guildID = interaction.guildId;

        if (this.queue[guildID] && this.queue[guildID].length > 0) {
            let queueString = '';

            let queue = this.queue[guildID].map((item, index) => `[${index+1}] ${item.name}`);
            if (queue.length > 10) {
                queue = queue.slice(0, 10);
                queueString = `目前歌單：\n${queue.join('\n')}\n……與其他 ${this.queue[guildID].length - 10} 首歌`;
            } else {
                queueString = `目前歌單：\n${queue.join('\n')}`;
            }

            interaction.reply({ content: queueString });
        } else {
            interaction.reply({ content: '目前隊列中沒有歌曲' });
        }

    }


    deletePlayList(interaction) {
        const guildID = interaction.guildId;
        const id = interaction.options.getString('id').trim();

        this.queue[guildID] = this.queue[guildID].filter(q => q.id !== id);
        interaction.reply({ content: `刪除ID為 ${id} 的播放清單歌曲` });
    }

    leave(interaction) {

        const guildID = interaction.guildId;

        if (this.connection[guildID]) {

            if (this.queue.hasOwnProperty(guildID)) {
                delete this.queue[guildID];
                this.isPlaying[guildID] = false;
            }

            this.connection[guildID].disconnect();

            interaction.reply({ content: '離開頻道' });
        } else {
            interaction.reply({ content: '機器人未加入任何頻道' });
        }

    }
}

module.exports = new Music();