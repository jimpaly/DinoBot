import { CommandInteraction, GuildChannel, GuildMember, User } from "discord.js"
import { Arg, SubCommand } from "."



export interface Args {
	getSubCommand(): string | null
	getString(name: string): string | null
	getNumber(name: string): number | null
	getUser(name: string): Promise<User | null>
	getMember(name: string): Promise<GuildMember | null>
	getChannel(name: string): Promise<GuildChannel | null>
}

export class SlashArgs implements Args {
	interaction: CommandInteraction

	constructor(interaction: CommandInteraction) {
		this.interaction = interaction
	}	

	getSubCommand = () => this.interaction.options.getSubcommand()
	getString = (name: string) => this.interaction.options.getString(name.toLowerCase())
	getNumber = (name: string) => this.interaction.options.getNumber(name.toLowerCase())
	getUser = async (name: string) => this.interaction.options.getUser(name.toLowerCase())
	getMember = async (name: string) => {
		const member = this.interaction.options.getMember(name.toLowerCase())
		return (member instanceof GuildMember) ? member : null
	}
	getChannel = async (name: string) => {
		const channel = this.interaction.options.getChannel(name.toLowerCase())
		return (channel instanceof GuildChannel) ? channel : null
	}
	
}

export class TextArgs implements Args {
	subCommand?: string
	options: Arg[]
	args: string[]

	constructor(text: string, options: Arg[], subCommands: SubCommand[]) {
		this.options = options
		this.args = [...text.matchAll(/[^\s"]+|"([^"]*)"/gi)]
			.map(matches => matches[1] ?? matches[0])
		const subCommand = subCommands.find(c => c.findKeyword(this.args[0]))
		if (subCommand) {
			this.subCommand = subCommand.name
			this.options = subCommand.args
			this.args = this.args.slice(1)
		}
	}

	getSubCommand = () => this.subCommand ?? null

	getString(name: string) {
		const { option, arg } = this.getArg(name)
		if (!option || !arg || option.type !== 'string') return null
		return arg
	}
	getNumber(name: string) {
		const { option, arg } = this.getArg(name)
		if (!option || !arg || option.type !== 'number') return null
		if (isNaN(Number(arg))) return null
		return Number(arg)
	}
	async getUser(name: string) {
		let { option, arg } = this.getArg(name)
		if (!option || !arg || option.type !== 'user') return null
		if (/^(<@!)?[0-9]+(>)?$/.test(arg)) arg = arg.slice(3, -1)
		if (/^[0-9]+$/.test(arg)) return await global.client.users.fetch(arg)
		return global.client.users.cache.find(({username}) => 
			username.toLowerCase() === arg.toLowerCase()) 
			?? global.client.users.cache.find(({username}) => 
			username.toLowerCase().includes(arg.toLowerCase()))
			?? null
	}
	async getMember(name: string) {
		let { option, arg } = this.getArg(name)
		if (!option || !arg || option.type !== 'member') return null
		if (/^(<@!)?[0-9]+(>)?$/.test(arg)) arg = arg.slice(3, -1)
		if (/^[0-9]+$/.test(arg)) return await global.guild.members.fetch(arg)
		return (await global.guild.members.search({query: arg})).first() ?? null
	}
	async getChannel(name: string) {
		let { option, arg } = this.getArg(name)
		if (!option || !arg || option.type !== 'channel') return null
		if (/^(<#)?[0-9]+(>)?$/.test(arg)) arg = arg.slice(2, -1)
		if (/^[0-9]+$/.test(arg)) return await global.guild.channels.fetch(arg)
		let channel = global.guild.channels.cache.find(({name}) => name.toLowerCase() === arg.toLowerCase())
		if (channel && !channel.isThread()) return channel
		channel = global.guild.channels.cache.find(({name}) => name.toLowerCase().includes(arg.toLowerCase()))
		if (channel && !channel.isThread()) return channel
		return null
	}

	getArg(name: string) {
		const index = this.options.findIndex(option => option.name === name)
		return {
			option: this.options[index],
			arg: this.args[index],
		}
	}
}
