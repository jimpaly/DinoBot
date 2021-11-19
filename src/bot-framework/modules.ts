import { Module } from ".";
import { Command, matchKeyword } from "./command";
import { ModuleLoader } from "./module";

export class Modules extends Array<Module> {
	constructor(private include: string[]) {
		super(0)
	}

	async load() {
		for (const directory of this.include) {
			const loader = (await require(`../modules/${directory}/index.js`)) as ModuleLoader
			this.push(await loader.load(directory))
		}

		// load command into client event emitters
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
			const keyword = message.content.split(/\s+/)[0];
			const command = this.findCommand(keyword)
			if (command && command.type !== 'slash') {
				message.content = message.content.slice(keyword.length).trim()
				return await command.executeTextCommand(message)
			}
		})
		global.client.on('interactionCreate', async (interaction) => {
			if (!interaction.isCommand()) return
			if (global.config.disabledChannels.includes(interaction.channelId)) return interaction.reply({
				content: `Oops! It looks like commands are disabled in global.client channel`, ephemeral: true})
			
			const command = this.getCommand(interaction.commandName)
			if (command && command.type !== 'text') return await command.executeSlashCommand(interaction)
			else interaction.reply(`Oof! It looks like that command doesn't exist anymore! Please contact <@!${process.env.OWNER}>`)
		})

		// load listeners into client event emitters
		global.client.on('messageCreate', (message) => {
			for (const module of this) for (const listener of module.listeners) 
				if (listener.isMessage()) listener.messageCreate(message)
		})
		global.client.on('messageDelete', (message) => {
			for (const module of this) for (const listener of module.listeners) 
				if (listener.isMessage()) listener.messageDelete(message) 
		})
		global.client.on('messageDeleteBulk', (messages) => {
			for (const module of this) for (const listener of module.listeners) 
				if (listener.isMessage()) messages.forEach(message => listener.messageDelete(message))
		})
	}

	getSlashCommands() { return this
		.reduce<Command<any>[]>((commands, module) => commands.concat(module.commands), [])
		.filter(({type}) => type !== 'text')
		.map(command => command.getSlashCommand())
	}

	getCommands() { return this
		.reduce<Command<any>[]>((commands, module) => commands.concat(module.commands), [])
	}

	findCommand(keyword: string) {
		if (!keyword) return 
		for (const module of this) for (const command of module.commands)
			if (matchKeyword(command, keyword)) return command
	}

	getCommand(name: string) {
		if (!name) return
		for (const module of this) for (const command of module.commands)
			if (command.name.toLowerCase() === name.toLowerCase()) return command
	}

}