
/*
		  ██████   ██  ███    ██   ██████   ██████    ██████   ████████ 
		  ██   ██  ██  ████   ██  ██    ██  ██   ██  ██    ██     ██    
		  ██   ██  ██  ██ ██  ██  ██    ██  ██████   ██    ██     ██    
		  ██   ██  ██  ██  ██ ██  ██    ██  ██   ██  ██    ██     ██    
		  ██████   ██  ██   ████   ██████   ██████    ██████      ██    
*/

import * as readLine from 'readline'
import { Intents } from 'discord.js'
import { BotClient } from './bot-framework'
import * as dotenv from 'dotenv'
import * as config from './config'


(async function() {

	dotenv.config();
	await config.load();

	process.stdout.write(`${new Date().toLocaleString('en-US')}`)

	// Create Discord client
	global.client = new BotClient({ 
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MEMBERS,
		],
		partials: ['MESSAGE', 'GUILD_MEMBER'],
	});

	global.client.loadCommands(/*[
		{
			name: 'Dev',
			description: 'Development commands'
		}
	]*/)

	readLine.cursorTo(process.stdout, 30)
	process.stdout.write(`Logging into Discord`)
	global.client.login(process.env.BOT_TOKEN)

	// When the bot starts...
	global.client.once('ready', async () => {
		global.guild = await global.client.guilds.fetch(process.env.GUILD as string)
		readLine.cursorTo(process.stdout, 30)
		process.stdout.write(`Logged in as @${global.client.user?.tag}\n`)
	});
}())