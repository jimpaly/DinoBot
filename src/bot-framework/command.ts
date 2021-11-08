import { SlashCommandBuilder } from "@discordjs/builders"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9"
import { CommandInteraction, GuildMember, Message, Permissions, User } from "discord.js"
import { Arg, ArgOptions, Args, SlashArgs, SubCommand, SubCommandOptions, TextArgs } from "."


export type CommandUserPermission = 'public' | 'admin' | 'owner'
// export type CommandChannelPermission = 'all' | 'dm' | 'guild'
export type CommandType = 'text' | 'slash' | 'both'

export interface CommandExecuteData {
	user: User
	member?: GuildMember
	permissions?: Permissions
}
export interface CommandOptions {
	name: string
	description: string
	details?: string
	aliases?: string[]
	disabled?: boolean
	permission?: CommandUserPermission
	guildOnly?: boolean
	type?: CommandType
	args?: ArgOptions[]
	subCommands?: SubCommandOptions[]
		
	/** the main logic for the command.  */
	execute: (args: Args, data: CommandExecuteData) => Promise<string>
}

/**
 * commands are basically functions that are called by
 * users sending messages with specific arguments
 */
export class Command {
	name: string
	description: string
	details: string
	aliases: string[]
	disabled: boolean
	permission: CommandUserPermission
	guildOnly: boolean
	type: CommandType
	args: Arg[]
	subCommands: SubCommand[]

	execute: (args: Args, data: CommandExecuteData) => Promise<string>

	constructor(options: CommandOptions) {
		this.name = options.name
		this.description = options.description
		this.details = options.details ?? ''
		this.aliases = options.aliases ?? []
		this.disabled = options.disabled ?? false
		this.permission = options.permission ?? 'public'
		this.guildOnly = options.guildOnly ?? false
		this.type = options.type ?? 'text'
		this.args = options.args?.map(arg => new Arg(arg)) ?? []
		this.subCommands = options.subCommands?.map(sub => new SubCommand(sub)) ?? []
		this.execute = options.execute
	}

	/**
	 * converts this command into a slash command
	 * @returns a slash command
	 */
	getSlashCommand(): RESTPostAPIApplicationCommandsJSONBody {
		const command = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description)
			.setDefaultPermission(this.permission === 'public')
		if (this.subCommands.length == 0) for (const arg of this.args) arg.addToCommand(command)
		else for (const subCommand of this.subCommands) subCommand.addToCommand(command)
		return command.toJSON()
	}

	/**
	 * tells whether a given text is using this command
	 * @param text the text that is trying to run a command
	 * @returns this command's name, or null the text doesn't match
	 */
	findKeyword(text: string) {
		text = text.toLowerCase()
		if (text.startsWith(this.name.toLowerCase())) return this.name
		return this.aliases.find(alias => text.startsWith(alias.toLowerCase())) ?? null
	}

	/**
	 * executes the command from a text message
	 * @param message the message that is calling this command
	 */
	async executeTextCommand(message: Message) {
		if (this.disabled) return
		if (this.guildOnly && message.channel.type === 'DM') return
		if (this.permission == 'owner' && message.author.id !== process.env.OWNER) return
		if (this.guildOnly && this.permission == 'admin' && !message.member?.permissions.has('ADMINISTRATOR')) return
		message.reply(await this.execute(new TextArgs(message.content, this.args, this.subCommands), {
			user: message.author,
			member: message.member ?? undefined,
			permissions: message.member?.permissions
		}))
	}

	/**
	 * executes the command from a discord slash command interaction
	 * @param interaction the interaction that is calling this command
	 */
	async executeSlashCommand(interaction: CommandInteraction) {
		await interaction.reply(await this.execute(new SlashArgs(interaction), {
			user: interaction.user,
			member: (interaction.member instanceof GuildMember) ? interaction.member : undefined,
			permissions: (interaction.member instanceof GuildMember) ? interaction.member.permissions : undefined
		}))
	}

}


export type Category = {
	name: string
	description: string
	commands: string[]
}
export type CategoryOptions = Omit<Category, 'commands'>