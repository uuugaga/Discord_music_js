const { Events } = require('discord.js');

// 註冊指令
const registerCommands = async (client, commands) => {
	try {
		if (client.application) {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);
			const data = await client.application.commands.set(commands);
			console.log(`Successfully reloaded ${data.size} application (/) commands.`);
		}
	} catch(e) {
		console.error(e);
	}
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client, commands) { // Added commands as a parameter
		console.log(`Ready! Logged in as ${client.user.tag}`);
		registerCommands(client, commands); // Pass commands to the registerCommands function
	},
};
