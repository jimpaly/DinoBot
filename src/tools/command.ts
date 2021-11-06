import glob from 'glob'
import { promisify } from 'util'
import { Client, Collection, Message } from 'discord.js'

const globPromise = promisify(glob)


export type CommandUserPermission = 'public' | 'admin' | 'owner'
export type CommandChannelPermission = 'all' | 'dm' | 'guild'
export type CommandType = 'text' | 'slash' | 'both'

export type CommandOptions = {
	name: string
	description: string
	details?: string
	aliases?: string[]
	disabled?: boolean
	permission?: CommandUserPermission
	channel?: CommandChannelPermission
	type?: CommandType
	args?: Argument[]
	execute: (args: string[]) => Promise<string>
}

export class Command {
	name: string
	description: string
	details: string
	aliases: string[]
	disabled: boolean
	permission: CommandUserPermission
	channel: CommandChannelPermission
	type: CommandType
	args: Argument[]

	constructor(options: CommandOptions) {
		this.name = options.name
		this.description = options.description
		this.details = options.details ?? ''
		this.aliases = options.aliases ?? []
		this.disabled = options.disabled ?? false
		this.permission = options.permission ?? 'public'
		this.channel = options.channel ?? 'all'
		this.type = options.type ?? 'text'
	}

	execute: (args: string[]) => Promise<string>
}




type Arg<T> = {
	name: string
	description: string
	default?: T
	type: 'string'
}
export type StringArg = Arg<string> & {
	choices?: string[]
}
export type Argument = StringArg

class Args {
	args: string[]
	options: Argument[]

	constructor(text: string, options: Argument[]) {
		this.args = text.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g) ?? []
		this.options = options
	}

	getString(name: string) {
		let i = 0
		for (const option of this.options) {
			if (option.name === name) {
				if (option.type !== 'string') throw `argument "${name}" is not a string`
				if (i >= this.args.length) return option.default ?? ''
				else return this.args[i]
			}
			i++
		}
		throw `no such argument "${name}"`
	}
}

export type Category = {
	directory: string
	name: string
	description: string
	commands: string[]
}
export type CategoryOptions = Omit<Category, 'commands'>

export class BotClient extends Client {
	commands: Collection<string, Command> = new Collection()
	categories: Category[] = []

	async loadCommands(options: CategoryOptions[]) {
		this.commands = new Collection()
		this.categories = []

		for (const categoryOptions of options) {
			const category = { ...categoryOptions, commands: [] as string[] }
			const files = await globPromise(`${__dirname}/../commands/**/*.js`)
			for (const file of files) {
				// I am not sure if this works, you could go for require(file) as well
				const command = (await import(file)) as Command
				command.aliases ??= [command.name.toLowerCase()]
				command.permission ??= 'public'
				command.channel ??= 'guild'
				command.type ??= 'text'
				this.commands.set(command.name, command)
				category.commands.push(command.name)
			}
			this.categories.push(category)
		}

		this.on('messageCreate', async (message: Message) => {
			//if(message.author.bot) return
			if(!this.user || message.author.id === this.user.id) return
			// TODO: check disabled channel
		
			let args: string[]
			if(message.content.startsWith(global.config.prefix)) {
				args = message.content.slice(global.config.prefix.length).trim().split(/\s+/)
			} else if(message.content.startsWith('<@!'+this.user.id+'>')) {
				args = message.content.slice(this.user.id.length+4).trim().split(/\s+/)
			} else return

			const lookup = args.shift()?.toLowerCase()
			if (!lookup) return
			for (const [name, command] of this.commands) {
				if (!command.aliases.includes(lookup)) continue
				if (command.disabled) return
				if (command.channel == 'dm' && message.channel.type != 'DM') return
				if (command.channel == 'guild' && message.channel.type == 'DM') return
				if (command.permission == 'owner' && message.author.id !== process.env.OWNER) return
				if (command.permission == 'admin' && !message.member?.permissions.has('ADMINISTRATOR')) return
				message.reply(await command.execute([]))
				return
			}
		})
	}
}