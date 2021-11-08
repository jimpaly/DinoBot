
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
import * as database from './database'

export function print(x: number, message: string) {
	readLine.cursorTo(process.stdout, x)
	process.stdout.write(message)
}

(async function() {

	print(0, `${new Date().toLocaleString('en-US')}`)

	dotenv.config();

	await database.load()
	await database.config()
	print(30, `Loaded database ./db/${process.env.DATABASE}`)

	// Create Discord client
	global.client = new BotClient({
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MEMBERS,
		],
		partials: ['MESSAGE', 'GUILD_MEMBER', 'CHANNEL'],
	});

	await global.client.loadCommands()

	print(70, `Logging into Discord`)
	global.client.login(process.env.BOT_TOKEN)

	// When the bot starts...
	global.client.once('ready', async () => {
		global.guild = await global.client.guilds.fetch(process.env.GUILD as string)
		print(70, `Logged in as @${global.client.user?.tag}\n`)
	});

}())