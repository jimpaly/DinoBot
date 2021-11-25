import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v9'
import { Client, Intents } from 'discord.js'
import { Modules, Command } from './bot-framework'
import * as dotenv from 'dotenv'
import { Module } from './bot-framework'
import { SlashCommandBuilder } from '@discordjs/builders'

interface Permission {
	id: string
	type: 'ROLE' | 'USER'
	permission: boolean
}

(async function() {

	dotenv.config();
	
	// start up a bot instance to access command IDs later
	global.client = new Client({ 
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MEMBERS,
		],
		partials: ['MESSAGE', 'GUILD_MEMBER'],
	});
	await global.client.login(process.env.BOT_TOKEN)
	if (!global.client.user?.id) throw new Error('bot failed to login!')

	global.modules = new Modules([
		'dev', 'fun', 'stats', 'utility'
	])
	await global.modules.load()

	// only adding commands to this guild
	// TODO: enable global commands for ones that are also in dms
	global.guild = await global.client.guilds.fetch(process.env.GUILD)

	// create slash commands
	const commands = global.modules
		.reduce<Command<any>[]>((commands, module) => commands.concat(module.commands), [])
		.filter(({type}) => type !== 'text')
		.map(command => command.getSlashCommand())
	await new REST({ version: '9' }).setToken(process.env.BOT_TOKEN)
		.put(Routes.applicationGuildCommands(global.client.user.id, process.env.GUILD), { body: commands })
	console.log(`Successfully registered ${commands.length} slash commands:`)
	console.log(commands.map(command => command.name).join(', '))

	// test command
	// const command = new SlashCommandBuilder()
	// 	.setName('test')
	// 	.setDescription('test command')
	// 	.addSubcommand(subcommand => subcommand
	// 		.setName('subcommand0')
	// 		.setDescription('top-level subcommand'))
	// 	.addSubcommandGroup(group => group
	// 		.setName('group1')
	// 		.setDescription('subcommand group 1')
	// 		.addSubcommand(subcommand => subcommand
	// 			.setName('subcommand1')
	// 			.setDescription('first subcommand'))
	// 		.addSubcommand(subcommand => subcommand
	// 			.setName('subcommand2')
	// 			.setDescription('second subcommand')))
	// 	.addSubcommandGroup(group => group
	// 		.setName('group2')
	// 		.setDescription('subcommand group 2')
	// 		.addSubcommand(subcommand => subcommand
	// 			.setName('subcommand3')
	// 			.setDescription('third subcommand'))
	// 		.addSubcommand(subcommand => subcommand
	// 			.setName('subcommand4')
	// 			.setDescription('fourth subcommand')))
	// await new REST({ version: '9' }).setToken(process.env.BOT_TOKEN)
	// 	.put(Routes.applicationGuildCommands(global.client.user.id, process.env.GUILD), { body: [command.toJSON()] })

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
		for (const module of global.modules) for (const command of module.commands) {
			if (command.name.toLowerCase() !== appCommand.name) continue
			if (command.hidden || command.permission === 'public') return prev
			if (command.permission === 'admin') {numAdmin++; return prev.concat({id: appCommand.id, permissions: adminPermissions})}
			if (command.permission === 'owner') {numOwner++; return prev.concat({id: appCommand.id, permissions: ownerPermissions})}
		}
		return prev
	}, []) ?? []
	await global.guild.commands.permissions.set({ fullPermissions })
	console.log(`Updated permissions of ${fullPermissions.length} commands (${numAdmin} admin; ${numOwner} owner)`)
	//TODO: make a command to refresh permissions after new roles are created

	process.exit()

})()
