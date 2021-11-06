import { SlashCommandBuilder, SlashCommandChannelOption, SlashCommandNumberOption, SlashCommandStringOption, SlashCommandUserOption } from "@discordjs/builders"
import { CommandInteraction, GuildChannel, GuildMember, User } from "discord.js"

export type ArgOptionTypes = 'string' | 'number' | 'user' | 'member' | 'channel'
export type SlashCommandOption = SlashCommandStringOption | SlashCommandNumberOption | SlashCommandUserOption | SlashCommandChannelOption

export interface SubCommand {
	name: string
	description: string
	aliases?: string[]
	args?: ArgOption[]
}
export interface ArgChoice<T> {
	name: string
	value: T
}
export interface ArgOptionOptions {
	name: string
	description: string
	type: ArgOptionTypes
	optional?: boolean
	choices?: ArgChoice<string>[] | ArgChoice<number>[]
}
export class ArgOption {
	name: string
	description: string
	type: ArgOptionTypes
	optional: boolean
	choices: ArgChoice<string>[] | ArgChoice<number>[]

	constructor(options: ArgOptionOptions) {
		this.name = options.name
		this.description = options.description
		this.type = options.type
		this.optional = options.optional ?? false
		this.choices = options.choices ?? []
	}

	setSlashOption<T extends SlashCommandOption>(option: T): T {
		option
			.setName(this.name.toLowerCase())
			.setDescription(this.description)
			.setRequired(!this.optional)
		if (option instanceof SlashCommandStringOption)
			this.choices?.forEach(({name, value}) => option.addChoice(name, value as string))
		if (option instanceof SlashCommandNumberOption)
		this.choices?.forEach(({name, value}) => option.addChoice(name, value as number))
		return option
	}
}

function isSubCommand(arg: string, subcommand: SubCommand) {
	return subcommand.name.toLowerCase() === arg.toLowerCase() 
	|| subcommand.aliases?.some(alias => alias.toLowerCase() === arg.toLowerCase())
}

export interface Args {
	options: ArgOption[]
	subCommand: SubCommand
	getSubCommand(): string | null
	getString(name: string): string | null
	getNumber(name: string): number | null
	getUser(name: string): User | null
	getMember(name: string): GuildMember | null
	getChannel(name: string): GuildChannel | null
}

export class SlashArgs implements Args {
	options: ArgOption[]
	subCommand: SubCommand
	interaction: CommandInteraction

	constructor(interaction: CommandInteraction) {
		this.interaction = interaction
	}	

	getSubCommand = () => this.interaction.options.getSubcommand()
	getString = (name: string) => this.interaction.options.getString(name.toLowerCase())
	getNumber = (name: string) => this.interaction.options.getNumber(name.toLowerCase())
	getUser = (name: string) => this.interaction.options.getUser(name.toLowerCase())
	getMember = (name: string) => {
		const member = this.interaction.options.getMember(name.toLowerCase())
		return (member instanceof GuildMember) ? member : null
	}
	getChannel = (name: string) => {
		const channel = this.interaction.options.getChannel(name.toLowerCase())
		return (channel instanceof GuildChannel) ? channel : null
	}
	
}

export class TextArgs implements Args {
	options: ArgOption[]
	subCommand: SubCommand
	args: string[]
	subArgs: string[]

	constructor(text: string, options: ArgOption[], subCommands: SubCommand[]) {
		this.options = options
		this.args = [...text.matchAll(/[^\s"]+|"([^"]*)"/gi)]
			.map(matches => matches[1] ?? matches[0])
		for (let i = 0; i < this.args.length; i++) {
			const subCommand = subCommands.find(subCommand => isSubCommand(this.args[i], subCommand))
			if (!subCommand) continue
			this.subCommand = subCommand
			this.subArgs = this.args.splice(i).slice(1)
			break
		}
	}

	getSubCommand = () => this.subCommand.name

	getString(name: string): string | null {
		throw new Error("Method not implemented.")
	}
	getNumber(name: string): number | null {
		throw new Error("Method not implemented.")
	}
	getUser(name: string): User | null {
		throw new Error("Method not implemented.")
	}
	getMember(name: string): GuildMember | null {
		throw new Error("Method not implemented.")
	}
	getChannel(name: string): GuildChannel | null {
		throw new Error("Method not implemented.")
	}
}
