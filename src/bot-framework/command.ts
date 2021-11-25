import { SlashCommandBuilder, SlashCommandChannelOption, SlashCommandNumberOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from "@discordjs/builders"
import { oneLine } from "common-tags"
import { APIMessage, ApplicationCommandOptionType, ApplicationCommandType, RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v9"
import { Awaitable, CommandInteraction, DMChannel, Guild, GuildChannel, GuildMember, InteractionReplyOptions, Message, MessageEditOptions, NewsChannel, PartialDMChannel, Permissions, ReplyMessageOptions, TextBasedChannels, TextChannel, ThreadChannel, User } from "discord.js"
import { replaceTags } from "../tools"

type ArgTypeStr = 'string' | 'number' | 'user' | 'member' | 'channel'
type ArgType = string | number | User | GuildMember | GuildChannel
type ArgTypeFromStr<Type extends ArgTypeStr> = Type extends 'string' ? string : Type extends 'number' ? number :
	Type extends 'user' ? User : Type extends 'member' ? GuildMember : Type extends 'channel' ? GuildChannel : ArgType
type ArgTypeToStr<Type extends ArgType> = Type extends string ? 'string' : Type extends number ? 'number' :
	Type extends User ? 'user' : Type extends GuildMember ? 'member' : Type extends GuildChannel ? 'channel' : ArgTypeStr

type ArgChoiceIndex<Type extends ArgType> = Type extends number | string ? Type : string
type ArgChoice<Type extends ArgType> = Type extends number ? number : string

export type ArgTypesTemplate = {[key: string]: ArgType}

export type CommandPermission = 'public' | 'admin' | 'owner'
// export type CommandChannelPermission = 'all' | 'dm' | 'guild'
export type CommandType = 'text' | 'slash' | 'both'

// TODO: add choices?
export interface Arg<Type extends ArgType> {
	description: string
	type: ArgTypeToStr<Exclude<Type, undefined>>
	optional: undefined extends Type ? true : false
	choices?: {[key in ArgChoiceIndex<Exclude<Type, undefined>>]: ArgChoice<Type>[]}
}

interface CommandExecuteData {
	user: User
	member?: GuildMember
	permissions?: Permissions
	channel?: TextBasedChannels
}

type ExecuteFunction<ArgTypes extends ArgTypesTemplate> = (
	args: ArgTypes, 
	reply: (options: string | ReplyMessageOptions | InteractionReplyOptions, data?: {
		member?: GuildMember
		user?: User
	}) => Promise<Message>, 
	data: CommandExecuteData
) => Awaitable<string | ReplyMessageOptions | void>
export interface CommandBlueprint<ArgTypes extends ArgTypesTemplate> {
	name: string
	description: string
	hidden?: boolean
	aliases?: string[]
	args: {[key in keyof Required<ArgTypes>]-?: Arg<ArgTypes[key]>}
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
	hidden: boolean
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
		readonly hidden: boolean,
		readonly permission: CommandPermission,
		readonly guildOnly: boolean,
		readonly type: CommandType,
		readonly args: {[key in keyof ArgTypes]-?: Arg<ArgTypes[key]>},
		readonly execute: ExecuteFunction<ArgTypes>,
	) { this.subcommands = [] }

	addSubcommand<SubcommandArgTypes extends ArgTypesTemplate>({
		name, description, aliases = [],
		hidden = this.hidden, permission = this.permission, guildOnly = this.guildOnly, type = this.type,
		args, execute,
	}: SubcommandCreator<SubcommandArgTypes>): Command<ArgTypes> { this.subcommands.push({
		name, description, aliases, 
		hidden, permission, guildOnly, type,
		args, execute
	}); return this }

	/**
	 * converts this command into a slash command
	 * @returns a slash command
	 */
	getSlashCommand(): RESTPostAPIApplicationCommandsJSONBody {

		const argTypes = {
			string: ApplicationCommandOptionType.String,
			number: ApplicationCommandOptionType.Number,
			user: ApplicationCommandOptionType.User,
			member: ApplicationCommandOptionType.User,
			channel: ApplicationCommandOptionType.Channel
		}

		function getCommandOptions<Type extends ArgTypesTemplate>(command: Command<Type> | Subcommand<Type>) {
			return Object.keys(command.args).map(name => { return {
				type: argTypes[command.args[name].type as ArgTypeStr],
				name: name,
				description: command.args[name].description,
				required: !command.args[name].optional,
				choices: Object.entries(command.args[name].choices ?? {}).map(([name, values]) => {return {
					name: name,
					value: (values as string[] | number[])[0],
				}}),
			}})
		}

		return {
			type: ApplicationCommandType.ChatInput,
			name: this.name,
			description: this.description,
			default_permission: this.permission === 'public',
			options: this.subcommands.length == 0 ? getCommandOptions(this) 
			: this.subcommands.map(subcommand => { return {
					type: ApplicationCommandOptionType.Subcommand,
					name: subcommand.name,
					description: subcommand.description,
					options: getCommandOptions(subcommand)
				}})
		}

		// return command.toJSON()
	}


	/**
	 * executes the command from a text message
	 * @param message the message that is calling this command
	 */
	async executeTextCommand(message: Message) {
		if (this.hidden) return
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

				if (option.type === 'string') {
					if (!option.choices) parsedArgs[name] = arg
					else {
						const choice = Object.entries(option.choices).find(([_, values]) => values.includes(arg))
						if (!choice) return message.reply(oneLine`"${arg}" is not a valid choice for the argument \`<${name}>\`! 
							Try using one of the following: "${Object.values(option.choices).map(values => values[0]).join('", "')}"`)
						else parsedArgs[name] = choice[0]
					}
				}
				else if (option.type === 'number') {
					if (isNaN(Number(arg))) return message.reply(`The argument \`<${name}>\` must be a number! Please re-enter the command`)
					const number = Number(arg)
					if (!option.choices) parsedArgs[name] = number
					else {
						const choice = Object.entries(option.choices).find(([_, values]) => values.includes(number))
						if (!choice) return message.reply(oneLine`${number} is not a valid choice for the argument \`<${name}>\`! 
							Try using one of the following: ${Object.values(option.choices).map(values => values[0]).join(', ')}`)
						else parsedArgs[name] = choice[0]
					}
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
		const reply = await command.execute(parsedArgs as ArgTypes, async (options, data) => {
			options = await replaceTags(options, {
				member: data?.member ?? message.member ?? undefined,
				user: data?.user ?? message.author
			})
			if (!lastMsg) lastMsg = await message.reply(options)
			else lastMsg = await lastMsg.reply(options)
			return lastMsg
		}, {
			user: message.author,
			member: message.member ?? undefined,
			permissions: message.member?.permissions,
			channel: message.channel
		})
		if (reply) message.reply(await replaceTags(reply, {
			member: message.member ?? undefined,
			user: message.author,
		}))
	}

	/**
	 * executes the command from a discord slash command interaction
	 * @param interaction the interaction that is calling this command
	 */
	async executeSlashCommand(interaction: CommandInteraction) {
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
		let reply = await command.execute(parsedArgs as ArgTypes, async (options, data) => {
			let message: Message | APIMessage | undefined
			options = await replaceTags(options, {
				member: data?.member ?? (interaction.member instanceof GuildMember) ? interaction.member as GuildMember : undefined,
				user: data?.user ?? interaction.user
			})
			if (!interaction.replied) {
				await interaction.reply(options)
				message = await interaction.fetchReply()
			} else message = await interaction.followUp(options)
			if (message instanceof Message) return message
			throw new Error(`Message isn't cached! Received API message :(`)
		}, {
			user: interaction.user,
			member: (interaction.member instanceof GuildMember) ? interaction.member : undefined,
			permissions: (interaction.member instanceof GuildMember) ? interaction.member.permissions : undefined,
			channel: interaction.channel ?? await global.guild.channels.fetch(interaction.channelId) as TextChannel ?? undefined
		})
		if (reply) reply = await replaceTags(reply, {
			member: (interaction.member instanceof GuildMember) ? interaction.member : undefined,
			user: interaction.user
		})
		if (reply) interaction.replied ? interaction.followUp(reply) : interaction.reply(reply)
	}

}

/**
 * tells whether a given text is using this command
 * @param text the text that is trying to run a command
 * @returns true if the command matches the keyword
 */
export function matchKeyword(command: Command<any> | Subcommand<any>, keyword: string) {
	if (!keyword) return undefined
	keyword = keyword.toLowerCase()
	if (keyword === command.name.toLowerCase()) return true
	return command.aliases.some(alias => keyword === alias.toLowerCase())
}

export function createCommand<ArgTypes extends ArgTypesTemplate>({
	name, description, details = '', aliases = [],
	hidden = false, permission = 'public', guildOnly = false, type = 'text',
	args, execute,
}: CommandCreator<ArgTypes>): Command<ArgTypes> { return new Command(
	name, description, details, aliases,
	hidden, permission, guildOnly, type,
	args, execute,
)}