import { SlashCommandBuilder, SlashCommandChannelOption, SlashCommandNumberOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from "@discordjs/builders"

export type ArgOptionTypes = 'string' | 'number' | 'user' | 'member' | 'channel'
export type SlashCommandOption = SlashCommandStringOption | SlashCommandNumberOption | SlashCommandUserOption | SlashCommandChannelOption


export interface SubCommandOptions {
	name: string
	description: string
	aliases?: string[]
	args?: ArgOptions[]
}

/**
 * Sub commands are keywords that come before every other arg.
 * This makes it easy to split commands into many different 
 * categories and change up the arg types in each category
 */
export class SubCommand {
	name: string
	description: string
	aliases: string[]
	args: Arg[]

	constructor(options: SubCommandOptions) {
		this.name = options.name
		this.description = options.description
		this.aliases = options.aliases ?? []
		this.args = options.args?.map(arg => new Arg(arg)) ?? []
	}

	/**
	 * tell whether the keyword matches with te current command
	 * @param arg the keyword to search for
	 * @returns the name of this command. if the keyword does not match, return null
	 */
	findKeyword(arg: string) {
		arg = arg.toLowerCase()
		if (this.name.toLowerCase() === arg) return this.name
		if (this.aliases?.some(alias => alias.toLowerCase() === arg)) return this.name
		return null
	}

	/**
	 * add this sub command to a slash command
	 * @param command the command to add this sub command to
	 */
	addToCommand(command: SlashCommandBuilder) {
		command.addSubcommand(subCommand => {
			subCommand
				.setName(this.name.toLowerCase())
				.setDescription(this.description)
			for (const arg of this.args) arg.addToCommand(subCommand)
			return subCommand
		})
	}
}


export interface ArgChoice<T> {
	name: string
	value: T
}
export interface ArgOptions {
	name: string
	description: string
	type: ArgOptionTypes
	optional?: boolean
	choices?: ArgChoice<string>[] | ArgChoice<number>[]
}

/**
 * describes an argument of a command
 */
export class Arg {
	name: string
	description: string
	type: ArgOptionTypes
	optional: boolean
	choices: ArgChoice<string>[] | ArgChoice<number>[]

	constructor(options: ArgOptions) {
		this.name = options.name
		this.description = options.description
		this.type = options.type
		this.optional = options.optional ?? false
		this.choices = options.choices ?? []
	}

	/**
	 * add this argument to a slash command
	 * @param command the command to add to
	 */
	addToCommand(command: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
		if (this.type === 'string') 			command.addStringOption(option => this.setSlashOption(option)
			.addChoices(this.choices.map(({name, value}) => [name, value as string])))
		else if (this.type === 'number') 	command.addNumberOption(option => this.setSlashOption(option)
			.addChoices(this.choices.map(({name, value}) => [name, value as number])))
		else if (this.type === 'user') 			command.addUserOption(option => this.setSlashOption(option))
		else if (this.type === 'member') 		command.addUserOption(option => this.setSlashOption(option))
		else if (this.type === 'channel')command.addChannelOption(option => this.setSlashOption(option))
	}

	private setSlashOption<T extends SlashCommandOption>(option: T): T {
		option
			.setName(this.name.toLowerCase())
			.setDescription(this.description)
			.setRequired(!this.optional)
		return option
	}
}