const play = require('play-dl');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder  } = require('discord.js');
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, UserSelectMenuBuilder } = require('discord.js');

class Music {

    constructor() {
        this.isPlaying = {};
        this.queue = {};
        this.connection = {};
        this.dispatcher = {};
        this.musicName = {};
        this.musicUrl = {};
        this.previousInteraction = {};
        this.previousMusicName = {};
    }

    clearGuildState(guildID) {
        // Clean up the connection
        if (this.connection[guildID]) {
            this.connection[guildID].disconnect();
            this.connection[guildID] = null;
        }

        // reset the guild state
        this.isPlaying[guildID] = false;
        this.queue[guildID] = [];
        this.dispatcher[guildID] = null;
        this.musicName[guildID] = '';
        this.musicUrl[guildID] = '';
        this.previousInteraction[guildID] = null;
        this.previousMusicName[guildID] = '';
    }

    // Send music status to the channel
    async sendMusicStatus(interaction, guildID) {
        try {
            // Check if there's no song in the queue
            if (!this.queue[guildID] || !this.isPlaying[guildID]) {
                const noSongMessage = '目前隊列中沒有歌曲';
                console.log(noSongMessage);
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({ content: noSongMessage, ephemeral: true });
                } else {
                    await interaction.reply({ content: noSongMessage, ephemeral: true });
                }
                return;
            }

            // Construct action rows with buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('resume').setStyle(ButtonStyle.Secondary).setEmoji('▶️'),
                    new ButtonBuilder().setCustomId('pause').setStyle(ButtonStyle.Secondary).setEmoji('⏸️'),
                    new ButtonBuilder().setCustomId('skip').setStyle(ButtonStyle.Secondary).setEmoji('⏭️'),
                    new ButtonBuilder().setCustomId('shuffle').setStyle(ButtonStyle.Secondary).setEmoji('🔀'),
                    new ButtonBuilder().setCustomId('loop').setStyle(ButtonStyle.Secondary).setEmoji('🔁')
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('recommend').setStyle(ButtonStyle.Primary).setEmoji('🔥'),
                    new ButtonBuilder().setCustomId('status').setStyle(ButtonStyle.Success).setEmoji('📊'),
                    new ButtonBuilder().setCustomId('leave').setStyle(ButtonStyle.Danger).setEmoji('🔚')
                );

            // Queue string construction
            const queueString = this.queue[guildID].length > 0 ? 
                this.queue[guildID].map((song, index) => `[${index + 1}] ${song.name}`).join('\n') : 
                'No more songs in queue';

            // Music embed creation
            const musicEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(this.musicName[guildID])
                .setURL(this.musicUrl[guildID])
                .setFields({ name: 'Queue', value: queueString, inline: true });

            // Sending or updating the message
            const content = `Now playing --> ${this.musicName[guildID]}`
            if (this.previousInteraction[guildID] && this.previousMusicName[guildID] === this.musicName[guildID]) {
                await this.previousInteraction[guildID].editReply({ embeds: [musicEmbed], content, components: [row, row2], ephemeral: false });
            } else {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [musicEmbed], content, components: [row, row2], ephemeral: false });
                } else {
                    await interaction.reply({ embeds: [musicEmbed], content, components: [row, row2], ephemeral: false });
                }
                this.previousInteraction[guildID] = interaction;
            }
            
        }
        catch(e) {
            console.log(e);
            interaction.channel.send('發生錯誤 :(');
        }
    }

    async playUrl(interaction, url) {
        const guildID = interaction.guildId;
    
        try {
            // Initialize the queue and isPlaying for the guild if not present
            this.queue[guildID] = this.queue[guildID] || [];
            this.isPlaying[guildID] = this.isPlaying[guildID] || false;
    
            // Fetch video information
            const videoInfo = await play.video_basic_info(url);
            const videoDetails = videoInfo.video_details;
    
            // Add the fetched video to the queue
            this.queue[guildID].push({
                id: videoDetails.id,
                name: videoDetails.title,
                url: url,
                artist: videoDetails.channel.name
            });
    
            // Respond based on whether music is already playing
            const addedSongMsg = `Added to queue: ${videoDetails.title}`;
            if (this.isPlaying[guildID]) {
                await (interaction.replied || interaction.deferred ? 
                    interaction.editReply({ content: addedSongMsg, ephemeral: true }) : 
                    interaction.reply({ content: addedSongMsg, ephemeral: true }));
            } else {
                this.isPlaying[guildID] = true;
                this.playMusic(interaction);
            }
    
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error occurred while adding the song.', ephemeral: true });
        }
    }
    

    async play(interaction) {
        if (interaction.member.voice.channel === null) {
            interaction.reply({ content: 'Please join the voice channel first.', ephemeral: true });
            return;
        }

        const guildID = interaction.guildId;
        this.connection[guildID] = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: guildID,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        const playInput = interaction.options.getString('play_input').trim();
        if(playInput.startsWith('http')) {
            this.playUrl(interaction, playInput);
        } else {
            this.searchAndRespond(interaction, playInput);
        }
    }

    async playMusic(interaction) {
        const guildID = interaction.guildId;

        try {
            if(this.queue[guildID].length <= 0){
                interaction.channel.send('目前隊列中沒有歌曲');
                this.clearGuildState(guildID);
                return;
            }
    
            if(this.isPlaying[guildID] === false) {
                this.isPlaying[guildID] = true;
            }
    

            const stream = await play.stream(this.queue[guildID][0].url);
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

            // Update musicName and musicUrl before shifting the queue
            this.musicName[guildID] = this.queue[guildID][0].name;
            this.musicUrl[guildID] = this.queue[guildID][0].url;

            this.queue[guildID].shift();

            await this.sendMusicStatus(interaction, guildID);

            this.previousMusicName[guildID] = this.musicName[guildID];

            player.on('stateChange', (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    this.playMusic(interaction);
                }
            });
            
        } catch(e) {
            console.log(e);
            interaction.channel.send('歌曲發生錯誤...');

            this.queue[guildID].shift();

            this.playMusic(interaction);
        }

    }

    async searchAndRespond(interaction, query) {
        try {
            let searchResults = await play.search(query, { limit: 5 });
            const options = searchResults.map((result, index) => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(result.title)
                    .setDescription(`Duration: ${result.durationRaw} `)
                    .setValue(result.url);
            });

            const select = new StringSelectMenuBuilder()
                .setCustomId('select_video')
                .setPlaceholder('Select a video')
                .addOptions(options);

            const row = new ActionRowBuilder()
                .addComponents(select);

            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: 'Select from youtube url or keyword', components: [row], ephemeral: true }); 
        } catch (error) {
            console.error(`error: ${error}`);
            await interaction.reply({ content: 'Something wrong when searching.', ephemeral: true });
        }
    }

    async handleAudioStream(interaction, guildID) {
        try {
            
        } catch(e) {
            console.error(e);
            interaction.channel.send('歌曲發生錯誤...');
        }
    }

    resume(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].unpause();
            interaction.reply({ content: 'resume', ephemeral: true });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    pause(interaction) {

        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].pause();
            interaction.reply({ content: 'pause', ephemeral: true });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }

    }

    skip(interaction) {
        const guildID = interaction.guildId;
        if (this.dispatcher[guildID]) {
            this.dispatcher[guildID].stop();
            interaction.reply({ content: 'Skip', ephemeral: true });
        } else {
            interaction.reply({ content: '機器人目前未加入頻道' });
        }
    }

    shuffle(interaction) {
        const guildID = interaction.guildId;
        if(this.queue[guildID]){
            this.queue[guildID].sort(() => Math.random() - 0.5);
            interaction.reply({ content: 'shuffle', ephemeral: true });
        }
        else{
            interaction.reply({ content: '目前隊列中沒有歌曲' });
        }
    }

    loop(interaction) {
        const guildID = interaction.guildId;
        if(this.queue[guildID]){
            interaction.reply({ content: 'single loop (尚未實裝)', ephemeral: true });
        }
        else{
            interaction.reply({ content: '目前隊列中沒有歌曲' });
        }
    }

    recommend(interaction) {
        const guildID = interaction.guildId;
        if(this.queue[guildID]){
            interaction.reply({ content: 'recommend (尚未實裝)', ephemeral: true });
        }
        else{
            interaction.reply({ content: '目前隊列中沒有歌曲' });
        }
    }

    async status(interaction) {
        const guildID = interaction.guildId;
        await interaction.reply({ content: 'status', ephemeral: true });
        await this.sendMusicStatus(interaction, guildID);

    }

    leave(interaction) {
        const guildID = interaction.guildId;
        if (this.connection[guildID]) {
            this.clearGuildState(guildID);
            interaction.reply({ content: 'leave', ephemeral: true });
        } else {
            interaction.reply({ content: '機器人未加入任何頻道' });
        }
    }
}

module.exports = new Music();