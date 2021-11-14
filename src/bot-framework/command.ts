import { SlashCommandBuilder, SlashCommandChannelOption, SlashCommandNumberOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from "@discordjs/builders"
import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9"
import { Awaitable, CommandInteraction, DMChannel, Guild, GuildChannel, GuildMember, Message, NewsChannel, PartialDMChannel, Permissions, ReplyMessageOptions, TextBasedChannels, TextChannel, ThreadChannel, User } from "discord.js"

type ArgTypeStr = 'string' | 'number' | 'user' | 'member' | 'channel'
type ArgType = string | number | User | GuildMember | GuildChannel
type ArgTypeFromStr<Type extends ArgTypeStr> = Type extends 'string' ? string : Type extends 'number' ? number :
	Type extends 'user' ? User : Type extends 'member' ? GuildMember : Type extends 'channel' ? GuildChannel : ArgType
type ArgTypeToStr<Type extends ArgType> = Type extends string ? 'string' : Type extends number ? 'number' :
	Type extends User ? 'user' : Type extends GuildMember ? 'member' : Type extends GuildChannel ? 'channel' : ArgTypeStr

export type ArgTypesTemplate = {[key: string]: ArgType}

export type CommandPermission = 'public' | 'admin' | 'owner'
// export type CommandChannelPermission = 'all' | 'dm' | 'guild'
export type CommandType = 'text' | 'slash' | 'both'

// TODO: add choices?
export interface Arg<Type extends ArgType> {
	description: string
	type: ArgTypeToStr<Exclude<Type, undefined>>
	optional: undefined extends Type ? true : false
}

interface CommandExecuteData {
	user: User
	member?: GuildMember
	permissions?: Permissions
	channel?: TextBasedChannels
}

type ExecuteFunction<ArgTypes extends ArgTypesTemplate> = (
	args: ArgTypes, 
	reply: (options: string | ReplyMessageOptions) => Promise<any>, 
	data: CommandExecuteData
) => Awaitable<string | ReplyMessageOptions | void>
export interface CommandBlueprint<ArgTypes extends ArgTypesTemplate> {
	name: string
	description: string
	disabled?: boolean
	aliases?: string[]
	args: {[key in keyof ArgTypes]-?: Arg<ArgTypes[key]>}
	execute: ExecuteFunction<ArgTypes>
}
interface CommandCreator<ArgTypes extends ArgTypesTemplate> extends CommandBlueprint<ArgTypes> {
	details?: string
	permission?: CommandPermission
	guildOnly?: boolean
	type?: CommandType
}
interface SubcommandCreator<ArgTypes extends ArgTypesTemplate> extends CommandBlueprint<ArgTypes> {
	permission?: CommandPermission
	guildOnly?: boolean
	type?: CommandType
}

interface Subcommand<ArgTypes extends ArgTypesTemplate> {
	name: string
	description: string
	aliases: string[]
	disabled: boolean
	permission: CommandPermission
	guildOnly: boolean
	type: CommandType
	args: {[key in keyof ArgTypes]-?: Arg<ArgTypes[key]>}
	execute: ExecuteFunction<ArgTypes>
}

/**
 * commands are basically functions that are called by
 * users sending messages with specific arguments
 */
export class Command<ArgTypes extends ArgTypesTemplate> {

	readonly subcommands: Subcommand<any>[]

	constructor(
		readonly name: string,
		readonly description: string,
		readonly details: string,
		readonly aliases: string[],
		readonly disabled: boolean,
		readonly permission: CommandPermission,
		readonly guildOnly: boolean,
		readonly type: CommandType,
		readonly args: {[key in keyof ArgTypes]-?: Arg<ArgTypes[key]>},
		readonly execute: ExecuteFunction<ArgTypes>,
	) { this.subcommands = [] }

	addSubcommand<SubcommandArgTypes extends ArgTypesTemplate>({
		name, description, aliases = [],
		disabled = this.disabled, permission = this.permission, guildOnly = this.guildOnly, type = this.type,
		args, execute,
	}: SubcommandCreator<SubcommandArgTypes>): Command<ArgTypes> { this.subcommands.push({
		name, description, aliases, 
		disabled, permission, guildOnly, type,
		args, execute
	}); return this }

	/**
	 * converts this command into a slash command
	 * @returns a slash command
	 */
	getSlashCommand(): RESTPostAPIApplicationCommandsJSONBody {
		const command = new SlashCommandBuilder()
			.setName(this.name).setDescription(this.description).setDefaultPermission(this.permission === 'public')

		// add options to slash command
		if (this.subcommands.length == 0) for (const name in this.args) addArgToCommand(command, name, this.args[name]);

		// add subcommands to slash command
		else for (const subcommand of this.subcommands) command.addSubcommand(slashSubcommand => {
			slashSubcommand.setName(subcommand.name.toLowerCase()).setDescription(subcommand.description)
			for (const name in subcommand.args) addArgToCommand(slashSubcommand, name, subcommand.args[name])
			return slashSubcommand
		})

		return command.toJSON()
	}


	/**
	 * executes the command from a text message
	 * @param message the message that is calling this command
	 */
	async executeTextCommand(message: Message) {
		if (global.config.disabledChannels.includes(message.channel.id)) return
		if (this.disabled) return
		if (this.guildOnly && message.channel.type === 'DM') return
		if (this.permission == 'owner' && message.author.id !== process.env.OWNER) return
		if (this.permission == 'admin' && !message.member?.permissions.has('ADMINISTRATOR')) return

		const parsedArgs: {[key: string]: ArgType} = {}
		let args = [...message.content.matchAll(/[^\s"]+|"([^"]*)"/gi)].map(matches => matches[1] ?? matches[0])
		const subcommand = this.subcommands.find(c => matchKeyword(c, args[0]))
		const command = subcommand ?? this
		if (subcommand) args = args.slice(1)

		let i = 0
		for (const name in command.args) {
			const option = command.args[name], arg = args[i]
			if (!arg) {
				if (!option.optional) return message.reply(`The argument \`<${name}>\` is required! Please re-enter the command`)
			} else {

				if (option.type === 'string') parsedArgs[name] = arg

				else if (option.type === 'number') {
					if (isNaN(Number(arg))) return message.reply(`The argument \`<${name}>\` must be a number! Please re-enter the command`)
					parsedArgs[name] = Number(arg)
				} 
				else if (option.type === 'user') {
					const userStr = /^(<@!)?[0-9]+(>)?$/.test(arg) ? arg.slice(3, -1) : arg
					let user = null
					if (/^[0-9]+$/.test(userStr)) user = await global.client.users.fetch(userStr)
					else user = global.client.users.cache.find(({username}) => 
						username.toLowerCase() === userStr.toLowerCase()) 
						?? global.client.users.cache.find(({username}) => 
						username.toLowerCase().includes(userStr.toLowerCase()))
					if (!user) return message.reply(`I couldn't find the user, ${arg}. Try entering a different name`)
					parsedArgs[name] = user
				}
				else if (option.type === 'member') {
					const memberStr = /^(<@!)?[0-9]+(>)?$/.test(arg) ? arg.slice(3, -1) : arg
					let member = null
					if (/^[0-9]+$/.test(memberStr)) member = await global.guild.members.fetch(memberStr)
					else member = (await global.guild.members.search({query: memberStr})).first()
					if (!member) return message.reply(`I couldn't find the member, ${arg}. Try entering a different name`)
					parsedArgs[name] = member
				}
				else if (option.type === 'channel') {
					if (!/^(<#)?[0-9]+(>)?$/.test(arg)) return message.reply(`That isn't a valid channel! Try mentioning a channel`)
					let channel = await global.guild.channels.fetch(arg.slice(2, -1))
					if (!channel || channel.isThread()) return message.reply(`I couldn't find the channel, ${arg}. Try entering a different one`)
					parsedArgs[name] = channel
				}
			}
			i++
		}

		let lastMsg: Message | undefined
		const reply = await command.execute(parsedArgs as ArgTypes, async option => {
			if (!lastMsg) lastMsg = await message.reply(option)
			else await lastMsg.reply(option)
		}, {
			user: message.author,
			member: message.member ?? undefined,
			permissions: message.member?.permissions,
			channel: message.channel
		})
		if (reply) message.reply(reply)
	}

	/**
	 * executes the command from a discord slash command interaction
	 * @param interaction the interaction that is calling this command
	 */
	async executeSlashCommand(interaction: CommandInteraction) {
		if (global.config.disabledChannels.includes(interaction.channelId)) return
		const subcommand = interaction.options.getSubcommand(false)
		const command = subcommand ? this.subcommands.find(c => c.name === subcommand) ?? this : this
		const parsedArgs: {[key: string]: ArgType | null} = {}
		for (const name in command.args) {
			const arg = command.args[name]
			if (arg.type === 'string') parsedArgs[name] = interaction.options.getString(name)
			else if (arg.type === 'number') parsedArgs[name] = interaction.options.getNumber(name)
			else if (arg.type === 'user') parsedArgs[name] = interaction.options.getUser(name)
			else if (arg.type === 'member') {
				const member = interaction.options.getMember(name.toLowerCase())
				if (member instanceof GuildMember) parsedArgs[name] = member
				else if (member) interaction.reply(`I couldn't find the member for the argument \`<${name}>\`! Try entering again`)
			} else if (arg.type === 'channel') {
				const channel = interaction.options.getChannel(name.toLowerCase())
				if (channel instanceof GuildChannel) parsedArgs[name] = channel
				else if (channel) interaction.reply(`I couldn't find the channel for the argument \`<${name}>\`! Try entering again`)
			}
		}
		const reply = await command.execute(parsedArgs as ArgTypes, async options => {
			if (!interaction.replied) await interaction.reply(options)
			else await interaction.followUp(options)
		}, {
			user: interaction.user,
			member: (interaction.member instanceof GuildMember) ? interaction.member : undefined,
			permissions: (interaction.member instanceof GuildMember) ? interaction.member.permissions : undefined,
			channel: interaction.channel ?? await global.guild.channels.fetch(interaction.channelId) as TextChannel ?? undefined
		})
		if (reply) interaction.replied ? interaction.followUp(reply) : interaction.reply(reply);
	}

}

function addArgToCommand<Type extends ArgType>(command: SlashCommandBuilder | SlashCommandSubcommandBuilder, name: string, arg: Arg<Type>) {
	const setOption = <
		T extends SlashCommandStringOption | SlashCommandNumberOption | SlashCommandUserOption | SlashCommandChannelOption
	>(option: T): T => option.setName(name).setDescription(arg.description).setRequired(!arg.optional) as T
	if (arg.type === 'string') command.addStringOption(setOption)
		// .addChoices(this.choices.map(({name, value}) => [name, value as string])))
	else if (arg.type === 'number') command.addNumberOption(setOption)
		// .addChoices(this.choices.map(({name, value}) => [name, value as number])))
	else if (arg.type === 'user') command.addUserOption(setOption)
	else if (arg.type === 'member') command.addUserOption(setOption)
	else if (arg.type === 'channel') command.addChannelOption(setOption)
}

/**
 * tells whether a given text is using this command
 * @param text the text that is trying to run a command
 * @returns this command's name, or null the text doesn't match
 */
export function matchKeyword(command: Command<any> | Subcommand<any>, text: string) {
	if (!text) return undefined
	text = text.toLowerCase()
	if (text.startsWith(command.name.toLowerCase())) return command.name
	return command.aliases.find(alias => text.startsWith(alias.toLowerCase()))
}

export function createCommand<ArgTypes extends ArgTypesTemplate>({
	name, description, details = '', aliases = [],
	disabled = false, permission = 'public', guildOnly = false,type = 'text',
	args, execute,
}: CommandCreator<ArgTypes>): Command<ArgTypes> { return new Command(
	name, description, details, aliases,
	disabled, permission, guildOnly, type,
	args, execute,
)}