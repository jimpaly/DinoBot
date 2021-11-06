import { SlashCommandBuilder } from '@discordjs/builders'
import * as Discord from 'discord.js'
import { Interaction } from 'discord.js'
import { replace, ReplaceVars } from '../database'
import { isNumber, replaceTags } from './misc.js'

export type MessageChannel = Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel
export type User = Discord.User | Discord.GuildMember
export type ChannelType = "GUILD_TEXT" | "GUILD_VOICE" | "GUILD_CATEGORY" | "GUILD_NEWS" | "GUILD_STORE" | "GUILD_STAGE_VOICE" | Discord.ThreadChannelTypes
export interface Invite {
    code: string,
    uses: number,
    max: number,
    expire: number,
}

export interface Command {
	command: SlashCommandBuilder,
	permission: 'public' | 'admin' | 'owner',
	enabled: boolean,
	execute: (interaction: Interaction) => Promise<any>
}

// The guild cache so functions can access the guild without needing to be passed it
export let guild: Discord.Guild

/** Reply with a warning message if the member did something wrong */
export async function fault(message: Discord.Message, content: string, vars: ReplaceVars = {}) {
	return message.reply({embeds: [ await embed({
		title: 'OOPS!',
		description: content,
	}, vars)]})
}
/** Reply with a notice message of an error and log the error to the console */
export async function error(message: Discord.Message, err: Error, vars: ReplaceVars = {}) {
	console.error(err)
	return message.reply({embeds: [ await embed({
		title: 'OOF!',
		description: `I seem to be having a problem... Don't worry, this isn't your fault.`
	}, vars)]})
}
/** Reply with a success message to tell things went through */
export async function success(message: Discord.Message, content: string, vars: ReplaceVars = {}) {
	return message.reply({embeds: [ await embed({
		title: 'Success!',
		description: content
	}, vars)]})
}
/** 
 * Replace all tags in string with the member's info \
 * *{member.name} {member.avatar} {member.mention}*
 */
export async function replaceMember(str: string, member: User) {
    return await replaceTags(str, 'member', args => {
        if(args[0] === 'name') {
			return getName(member)
        } else if(args[0] === 'avatar') {
			const sizes: Discord.AllowedImageSize[] = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
			let size = sizes.find(s => s >= parseInt(args[1])) ?? 256
			if(member instanceof Discord.GuildMember) member = member.user
			return member.displayAvatarURL({ dynamic: true, size })
        } else if(args[0] === 'mention') {
            return `<@!${member.id}>`
        }
        return null
    })
}
/** Create an embed, replacing all tags */
export async function embed(embed: Discord.MessageEmbedOptions, vars: ReplaceVars = {}) {
    if(!embed.color) embed.color = '{color}' as Discord.ColorResolvable
	return new Discord.MessageEmbed(await replace(embed, vars) as Discord.MessageEmbedOptions)
}
/** Make a message pageable through reactions */
export async function page(message: Discord.Message, pages: number, 
	builder: (page: number) => Discord.MessageEmbed | Promise<Discord.MessageEmbed>) {

	if(pages > 1) {
		message.react('⏮').then(async () => {
			await message.react('◀️')
			await message.react('▶️')
			await message.react('⏭')
		})
	}
	let active = pages > 1
	let page = 1
	do {
		page = Math.max(1, Math.min(pages, page))
		message.edit({ embeds: [await builder(page) ]})
		if(!active) break
		await message.awaitReactions({filter: (reaction, user) => {
			if(user.id === message.client.user?.id) return false
			reaction.users.remove(user)
			return ['⏮', '◀️', '▶️', '⏭'].includes(reaction.emoji.name ?? '')
		}, max: 1, time: 20000, errors: ['time']}).then(reactions => {
			switch(reactions.first()?.emoji.name) {
				case '⏮': return page = 1
				case '⏭': return page = pages
				case '◀️': return page -= 1
				case '▶️': return page += 1
			}
		}).catch(() => {
			message.reactions.removeAll()
			active = false
		})
	} while(active)
	return message
}
/** List all channels in the guild in an organized fashion */
export async function listChannels(message: Discord.Message, title: string, 
	filter: ChannelType[] = ['GUILD_TEXT', 'GUILD_VOICE', 'GUILD_NEWS', 'GUILD_STAGE_VOICE'], 
	channelBuilder: (channel: Discord.GuildChannel) => string) {

	const channelStr = (channel: Discord.GuildChannel) => channelBuilder(channel)
	.replace(/{channel}/g, channel.isVoice() ? `🔊 ${channel.name}` : `<#${channel.id}>`)

	const sort = (a: Discord.GuildChannel, b: Discord.GuildChannel) => {
		if(a.type === b.type) return a.position - b.position
		if(a.isVoice()) return 1
		return -1
	}

	let allChannels = Array.from(guild.channels.cache, ([key, val]) => val).sort(sort)
	return message.reply({embeds: [ await embed({
		title: title,
		description: allChannels
		.filter(channel => filter.includes(channel.type) && channel.parent === null)
		.map(channelStr).join('\n'),
		fields: allChannels
		.filter(channel => channel.type === 'GUILD_CATEGORY')
		.map((channel: Discord.CategoryChannel) => { return {
			name: `${channel.name}`,
			inline: true,
			value: Array.from(channel.children, ([_, val]) => val).sort(sort)
			.filter((channel) => filter.includes(channel.type))
			.map(channelStr).join('\n')
		}})
	})]})
}

/** Find a member of the guild from a string */
export async function findMember(arg: string) {
	if(/^<@[0-9]+>$/.test(arg)) arg = arg.slice(2, -1)
	if(/^<@![0-9]+>$/.test(arg)) arg = arg.slice(3, -1)
	// const member = await guild.member(arg)
	// if(member) return member
	const members = await guild.members.fetch({ query: arg, limit: 1 })
	if(members.first()) return members.first()
}
/** Find a channel in the guild from a string */
export function findChannel(arg: string, filter: ChannelType[] = ['GUILD_TEXT', 'GUILD_VOICE', 'GUILD_STAGE_VOICE', 'GUILD_CATEGORY', 'GUILD_NEWS']) {
	if(!arg) return null
	let channels = guild.channels.cache.filter(channel => filter.includes(channel.type))
	if(/^<#[0-9]+>$/.test(arg)) arg = arg.slice(2, -1)
	if(channels.has(arg)) return channels.get(arg)
	const channel = channels.find(channel => channel.name.toLowerCase().includes(arg.toLowerCase()))
	if(channel) return channel
	return null
}
/** Find a channel in the guild from the string\
 *  If the string refers to a category, returns all channels in it\
 *  If the string is "all", return all channels in the guild
 */
export function findChannels(arg: string, filter: ChannelType[] = ['GUILD_TEXT', 'GUILD_VOICE', 'GUILD_STAGE_VOICE', 'GUILD_NEWS']) {
	if(arg === 'all') return guild.channels.cache.filter(channel => filter.includes(channel.type))
	const channel = findChannel(arg, ['GUILD_TEXT', 'GUILD_CATEGORY', 'GUILD_NEWS'])
	if(channel) {
		if(channel.type === 'GUILD_CATEGORY') return (channel as Discord.CategoryChannel).children
		.filter(channel => filter.includes(channel.type))
		return new Discord.Collection([[channel.id, channel]])
	}
	return new Discord.Collection<string, Discord.GuildChannel>()
}
/** Get [channel ID, message ID] from an ID pair, channel mention + ID, or message URL */
export function getMessageID(message: Discord.Message, arg1: string, arg2: string) {
	if(arg1 === undefined) return
	if(arg1.includes('discord.com/channels')) {
		let args = arg1.replace(/\//g, ' ').trim().split(/ +/)
		arg1 = args[args.length-2]
		arg2 = args[args.length-1]
	} else if(arg2 === undefined) {
		arg2 = arg1
		arg1 = message.channel.id
	}
	return [arg1.replace(/[^0-9]/g, ''), arg2.replace(/[^0-9]/g, '')]
}
/** Get the message object from an ID pair, channel mention + ID, or message URL */
export function findMessage(message: Discord.Message, arg1: string, arg2: string) {
	let args = getMessageID(message, arg1, arg2)
	if(args !== undefined) return getMessage(args[0], args[1])
}
/** Find the message in the guild from channel ID and message ID */
export async function getMessage(channelID: string, messageID: string) {
	let channel = guild.channels.cache.get(channelID) as Discord.TextChannel
	if(!channel || !channel.isText()) return null
	return await channel.messages.fetch(messageID).catch(() => {})
}
/** Parse channelID and messageID into a clickable url */
export function getURL(channelID: string, messageID: string) {
	return 'https://discord.com/channels/'+guild.id+'/'+channelID+'/'+messageID;
}
/** Get a collection of guild members and how many invites they have */
export async function getInvites() {
	let invites = new Discord.Collection<string, number>()
	let inv = await guild.invites.fetch()
	inv.forEach(invite => {
		if(!invite.inviter) return
		let count = invites.get(invite.inviter.id) ?? 0
		invites.set(invite.inviter.id, count+(invite.uses ?? 0))
	})
	return invites
}
/** Get the invite link a member has in the guild */
export async function getInviteLinks(member: User) {
	let inv = await guild.invites.fetch()
	return inv
		.filter(({inviter}) => inviter?.id !== member.id)
		.map(invite => { return {
			code: invite.code,
			uses: invite.uses || 0,
			max: invite.maxUses,
			expire: invite.expiresTimestamp,
		}})
}
/** Get the name/nickname of a discord user or member */
export function getName(member: User) {
	if(member instanceof Discord.User) return member.username
	return member.displayName
}