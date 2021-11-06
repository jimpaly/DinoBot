
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
	const client = new BotClient({ 
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MEMBERS,
		],
		partials: ['MESSAGE', 'GUILD_MEMBER'],
	});

	client.loadCommands(/*[
		{
			name: 'Dev',
			description: 'Development commands'
		}
	]*/)

	readLine.cursorTo(process.stdout, 30)
	process.stdout.write(`Logging into Discord`)
	client.login(process.env.BOT_TOKEN)

	// When the bot starts...
	client.once('ready', () => {
		readLine.cursorTo(process.stdout, 30)
		process.stdout.write(`Logged in as @${client.user?.tag}\n`)
	});
}())