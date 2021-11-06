import { SlashCommandBuilder } from "@discordjs/builders"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9"
import { CommandInteraction, Message } from "discord.js"


export type CommandUserPermission = 'public' | 'admin' | 'owner'
export type CommandChannelPermission = 'all' | 'dm' | 'guild'
export type CommandType = 'text' | 'slash' | 'both'

export interface CommandOptions {
	name: string
	description: string
	details?: string
	aliases?: string[]
	disabled?: boolean
	permission?: CommandUserPermission
	channel?: CommandChannelPermission
	type?: CommandType
	// args?: Argument[] TODO
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
	// args: Argument[] TODO
	execute: (args: string[]) => Promise<string>

	constructor(options: CommandOptions) {
		this.name = options.name
		this.description = options.description
		this.details = options.details ?? ''
		this.aliases = options.aliases ?? []
		this.disabled = options.disabled ?? false
		this.permission = options.permission ?? 'public'
		this.channel = options.channel ?? 'all'
		this.type = options.type ?? 'text'
		// TODO: args
		this.execute = options.execute
	}

	getSlashCommand(): RESTPostAPIApplicationCommandsJSONBody {
		const command = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description)
		return command.toJSON()
	}

	matchesKeyword(keyword: string) {
		keyword = keyword.toLowerCase()
		return this.name.toLowerCase() === keyword 
				|| this.aliases.some(alias => alias.toLowerCase() === keyword)
	}

	async executeTextCommand(message: Message) {
		if (this.disabled) return
		if (this.channel == 'dm' && message.channel.type != 'DM') return
		if (this.channel == 'guild' && message.channel.type == 'DM') return
		if (this.permission == 'owner' && message.author.id !== process.env.OWNER) return
		if (this.permission == 'admin' && !message.member?.permissions.has('ADMINISTRATOR')) return
		message.reply("command returned: " + await this.execute([]))
	}

	async executeSlashCommand(interaction: CommandInteraction) {
		interaction.reply(await this.execute([]))
	}

}


export type Category = {
	name: string
	description: string
	commands: string[]
}
export type CategoryOptions = Omit<Category, 'commands'>


// type Arg<T> = {
// 	name: string
// 	description: string
// 	default?: T
// 	type: 'string'
// }
// export type StringArg = Arg<string> & {
// 	choices?: string[]
// }
// export type Argument = StringArg

// export class Args {
// 	args: string[]
// 	options: Argument[]

// 	constructor(text: string, options: Argument[]) {
// 		this.args = text.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g) ?? []
// 		this.options = options
// 	}

// 	getString(name: string) {
// 		let i = 0
// 		for (const option of this.options) {
// 			if (option.name === name) {
// 				if (option.type !== 'string') throw `argument "${name}" is not a string`
// 				if (i >= this.args.length) return option.default ?? ''
// 				else return this.args[i]
// 			}
// 			i++
// 		}
// 		throw `no such argument "${name}"`
// 	}
// }
