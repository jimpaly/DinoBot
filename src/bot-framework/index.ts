import glob from 'glob'
import { promisify } from 'util'
import { Module, ModuleLoader } from './module'
import { Collection } from 'discord.js'
import { matchKeyword } from './command'
const globPromise = promisify(glob)

export {
	Module, createModule,
} from './module'

export {
	Command, createCommand,
	CommandPermission, CommandType,
} from './command'

export {
	createMessageListener, MessageListener
} from './listener'

export function findCommand(name: string) {
	for (const module of global.modules) for (const command of module.commands)
		if (command.name.toLowerCase() === name.toLowerCase()) return command
}

export async function load(modules: string[]) {
	global.modules = []
	for (const directory of modules) {
		const loader = (await require(`../modules/${directory}/index.js`)) as ModuleLoader
		global.modules.push(await loader.load(directory))
	}
	await loadCommands()
	await loadListeners()
}

async function loadCommands() {
	global.client.on('messageCreate', async (message): Promise<any> => {
		//if(message.author.bot) return
		if(!global.client.user || message.author.id === global.client.user.id) return
		if (global.config.disabledChannels.includes(message.channel.id)) return

		// a text is a command if it starts with the required prefix
		if(message.content.startsWith(global.config.prefix)) {
			message.content = message.content.slice(global.config.prefix.length).trim()
		} else if(message.content.startsWith('<@!'+global.client.user.id+'>')) {
			message.content = message.content.slice(global.client.user.id.length+4).trim()
		} else return

		// find the command, then execute it
		for (const module of global.modules) for (const command of module.commands) {
			const keyword = matchKeyword(command, message.content)
			if (command.type !== 'slash' && keyword) {
				message.content = message.content.slice(keyword.length).trim()
				return await command.executeTextCommand(message)
			}
		}
	})
	global.client.on('interactionCreate', async (interaction) => {
		if (!interaction.isCommand()) return
		if (global.config.disabledChannels.includes(interaction.channelId)) return interaction.reply({
			content: `Oops! It looks like commands are disabled in global.client channel`, ephemeral: true})
		
		for (const module of global.modules) for (const command of module.commands)
			if (command.name.toLowerCase() === interaction.commandName && command.type !== 'text') 
				return await command.executeSlashCommand(interaction)
		interaction.reply(`Oof! It looks like that command doesn't exist anymore! Please contact <@!${process.env.OWNER}>`)
	})
}


async function loadListeners() {
	global.client.on('messageCreate', (message) => {
		for (const module of global.modules) for (const listener of module.listeners) 
			if (listener.isMessage()) listener.messageCreate(message)
	})
	global.client.on('messageDelete', (message) => {
		for (const module of global.modules) for (const listener of module.listeners) 
			if (listener.isMessage()) listener.messageDelete(message) 
	})
	global.client.on('messageDeleteBulk', (messages) => {
		for (const module of global.modules) for (const listener of module.listeners) 
			if (listener.isMessage()) messages.forEach(message => listener.messageDelete(message))
	})
}