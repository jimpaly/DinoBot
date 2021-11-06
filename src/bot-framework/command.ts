import { SlashCommandBuilder } from "@discordjs/builders"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9"
import { CommandInteraction, Message } from "discord.js"
import { ArgOption, ArgOptionOptions, Args, SlashArgs, SubCommand, TextArgs } from "."


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
	args?: ArgOptionOptions[]
	subCommands?: SubCommand[]
	execute: (args: Args) => Promise<string>
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
	args: ArgOption[]
	subCommands: SubCommand[]

	execute: (args: Args) => Promise<string>

	constructor(options: CommandOptions) {
		this.name = options.name
		this.description = options.description
		this.details = options.details ?? ''
		this.aliases = options.aliases ?? []
		this.disabled = options.disabled ?? false
		this.permission = options.permission ?? 'public'
		this.channel = options.channel ?? 'all'
		this.type = options.type ?? 'text'
		this.args = options.args?.map(arg => new ArgOption(arg)) ?? []
		this.subCommands = options.subCommands ?? []
		this.execute = options.execute
	}

	getSlashCommand(): RESTPostAPIApplicationCommandsJSONBody {
		const command = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description)
		for (const arg of this.args) {
			if (arg.type === 'string') 				command.addStringOption(option => arg.setSlashOption(option))
			else if (arg.type === 'number') 	command.addNumberOption(option => arg.setSlashOption(option))
			else if (arg.type === 'user') 			command.addUserOption(option => arg.setSlashOption(option))
			else if (arg.type === 'member') 		command.addUserOption(option => arg.setSlashOption(option))
			else if (arg.type === 'channel') command.addChannelOption(option => arg.setSlashOption(option))
		}
		return command.toJSON()
	}

	findKeyword(text: string) {
		text = text.toLowerCase()
		if (text.startsWith(this.name.toLowerCase())) return this.name
		return this.aliases.find(alias => text.startsWith(alias.toLowerCase()))
	}

	async executeTextCommand(message: Message) {
		if (this.disabled) return
		if (this.channel == 'dm' && message.channel.type != 'DM') return
		if (this.channel == 'guild' && message.channel.type == 'DM') return
		if (this.permission == 'owner' && message.author.id !== process.env.OWNER) return
		if (this.permission == 'admin' && !message.member?.permissions.has('ADMINISTRATOR')) return
		message.reply(await this.execute(new TextArgs(message.content, this.args, this.subCommands)))
	}

	async executeSlashCommand(interaction: CommandInteraction) {
		interaction.reply(await this.execute(new SlashArgs(interaction)))
	}

}


export type Category = {
	name: string
	description: string
	commands: string[]
}
export type CategoryOptions = Omit<Category, 'commands'>