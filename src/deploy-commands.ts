import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v9'
import { Intents } from 'discord.js'
import * as dotenv from 'dotenv'
import { BotClient, Module } from './bot-framework'

interface Permission {
	id: string
	type: 'ROLE' | 'USER'
	permission: boolean
}

(async function() {

	dotenv.config();
	
	// start up a bot instance to access command IDs later
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
	await global.client.login(process.env.BOT_TOKEN)
	if (!global.client.user?.id) throw new Error('bot failed to login!')

	// only adding commands to this guild
	// TODO: enable global commands for ones that are also in dms
	global.guild = await global.client.guilds.fetch(process.env.GUILD as string)

	// create slash commands
	// const commands: RESTPostAPIApplicationCommandsJSONBody[] = []
	const commands = global.client.commands
		.filter(({disabled, type}) => !disabled && type !== 'text')
		.map(command => command.getSlashCommand())
	await new REST({ version: '9' }).setToken(process.env.BOT_TOKEN)
		.put(Routes.applicationGuildCommands(global.client.user.id, process.env.GUILD), { body: commands })
	console.log(`Successfully registered ${commands.length} slash commands.`)

	// set permissions for admin and owner only commands
	const adminPermissions: Permission[] = global.guild.roles.cache
		.filter(role => !role.tags?.botId && role.permissions.has('ADMINISTRATOR'))
		.map(role => { return { id: role.id, type: 'ROLE', permission: true, }})
	const ownerPermissions: Permission[] = [{ id: process.env.OWNER, type: 'USER', permission: true }]
	console.log(`Found ${adminPermissions.length} admin roles`)

	// make sure commands are cached
	if (global.guild.commands.cache.size == 0) await global.guild.commands.fetch()

	// set the permissions
	let numAdmin = 0, numOwner = 0
	const fullPermissions = global.guild.commands.cache.reduce((prev: {id: string, permissions: Permission[]}[], appCommand) => {
		const command = global.client.commands.get(appCommand.name)
		if (!command || command.disabled || command.permission === 'public') return prev
		if (command.permission === 'admin') {numAdmin++; return prev.concat({id: appCommand.id, permissions: adminPermissions})}
		if (command.permission === 'owner') {numOwner++; return prev.concat({id: appCommand.id, permissions: ownerPermissions})}
	}, []) ?? []
	await global.guild.commands.permissions.set({ fullPermissions })
	console.log(`Updated permissions of ${fullPermissions.length} commands (${numAdmin} admin; ${numOwner} owner)`)
	//TODO: make a command to refresh permissions after new roles are created

})()
