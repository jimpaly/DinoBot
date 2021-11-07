import glob from 'glob'
import { promisify } from 'util'
import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v9'
import { Intents } from 'discord.js'
import * as dotenv from 'dotenv'
import { BotClient, Module } from './bot-framework'
import assert = require('assert')

const globPromise = promisify(glob)

dotenv.config();

// declare function assert(value: unknown): asserts value;

(async function() {
	
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

	await global.client.loadCommands()

	global.client.login(process.env.BOT_TOKEN)


	global.client.once('ready', async () => {
		global.guild = await global.client.guilds.fetch(process.env.GUILD as string)

		const commands: RESTPostAPIApplicationCommandsJSONBody[] = []
		for (const [_, command] of global.client.commands) {
			if (command.disabled || command.type == 'text') continue
			commands.push(command.getSlashCommand())
		}

		assert(process.env.BOT_TOKEN)
		assert(global.client.user?.id)
		assert(process.env.GUILD)
		assert(process.env.OWNER)
		const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);
		await rest.put(Routes.applicationGuildCommands(global.client.user.id, process.env.GUILD), { body: commands })
		console.log(`Successfully registered ${commands.length} slash commands.`)

		interface Permission {
			id: string
			type: 'ROLE' | 'USER'
			permission: boolean
		}

		const adminPermissions: Permission[] = global.guild.roles.cache
			.filter(role => role.permissions.has('ADMINISTRATOR'))
			.map(role => { return { id: role.id, type: 'ROLE', permission: true, }})
	
		const ownerPermissions: Permission[] = [{ id: process.env.OWNER, type: 'USER', permission: true }]

		if (!global.client.application?.owner) await global.client.application?.fetch()
		assert(global.client.application)

		if (global.guild.commands.cache.size == 0) await global.guild.commands.fetch()

		let numAdmin = 0, numOwner = 0
		const fullPermissions = global.guild.commands.cache.reduce((prev: {id: string, permissions: Permission[]}[], appCommand) => {
			const command = global.client.commands.get(appCommand.name)
			if (!command || command.disabled || command.permission === 'public') return prev
			if (command.permission === 'admin') {numAdmin++; return prev.concat({id: appCommand.id, permissions: adminPermissions})}
			if (command.permission === 'owner') {numOwner++; return prev.concat({id: appCommand.id, permissions: ownerPermissions})}
		}, []) ?? []

		await global.guild.commands.permissions.set({ fullPermissions })
		console.log(`Updated permissions of ${fullPermissions.length} commands (${numAdmin} admin; ${numOwner} owner)`)
		//TODO: make a command to refresh permissions

		process.exit()
	})

})()
