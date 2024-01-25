// 引入需要的模組
const fs = require("node:fs"); // 用於讀寫檔案
const path = require("node:path"); // 用於處理路徑
const { Client, Collection, GatewayIntentBits } = require("discord.js"); // 引入 Discord.js 模組
const { token } = require("./config.json"); // 從 config.json 讀取 token

// if ctrl+c
process.on("SIGINT", () => {
	console.log("SIGINT");
	// wait all async function finish
	process.exit();
});

// 創建一個 Discord.js client
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// 創建一個 Collection 來存放指令
client.commands = new Collection();

// 用來存放 commands
const commands = [];

// 讀取 commands 資料夾下的 js 檔案
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

// 將指令加入 Collection
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[ERROR] The command at ${filePath} is missing a required "data" or "execute" property.`);
		continue;
	}

	// 存進 commands array
	commands.push(command.data.toJSON());
}


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, commands));
	} else {
		client.on(event.name, (...args) => event.execute(...args, commands));
	}
}

client.login(token);