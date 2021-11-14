import { oneLine } from "common-tags"
import { CategoryChannel, GuildChannel } from "discord.js"
import { createCommand } from "../../bot-framework"
import { listChannels } from "../../tools/tools"

function isDisabled(id: string) { return global.config.disabledChannels.includes(id) }
function disable(...ids: string[]) {
	for (const id of ids) if (!isDisabled(id))
		global.config.disabledChannels.push(id)
}
function enable(...ids: string[]) {
	for (const id of ids) {
		const i = global.config.disabledChannels.indexOf(id)
		if (i != -1) global.config.disabledChannels.splice(i, 1)
	}
}


module.exports = createCommand({
	name: 'perm',
	description: 'Channel Permissions',
	details: oneLine`
			🥺 You can change which channels I have access to...
	`,
	aliases: ['perms', 'permission', 'permissions'],
	permission: 'admin',
	guildOnly: true,
	type: 'both',
	args: {},
	async execute() { return {embeds: [
		await listChannels('Channel Perms', ['GUILD_TEXT', 'GUILD_NEWS'], channel =>
			`${isDisabled(channel.id) ? '🔴' : '🟢'} ${channel}`)
	]}}
}).addSubcommand({
	name: 'list',
	description: 'list the permission of all channels',
	args: {},
	async execute() { return {embeds: [
		await listChannels('Channel Perms', ['GUILD_TEXT', 'GUILD_NEWS'], channel =>
			`${isDisabled(channel.id) ? '🔴' : '🟢'} ${channel}`)
	]}}
}).addSubcommand<{
	channel: GuildChannel
}>({
	name: 'enable',
	description: 'enable commands on a channel',
	args: {
		channel: {
			description: 'the channel or category of channels to enable',
			type: 'channel',
			optional: false,
		}
	},
	async execute({channel}) {
		console.log(channel)
		if (channel.type === 'GUILD_CATEGORY') {
			const channels = (channel as CategoryChannel).children
			enable(...channels.map(channel => channel.id))
			await global.config.save()
			return {embeds: [{
				title: `🟢 The following channels of the category, ${channel.name}, are now enabled!`,
				description: channels.map(channel => `<#${channel.id}>`).join(' '),
			}]}
		} else {
			enable(channel.id)
			await global.config.save()
			return {embeds: [{
				title: `🟢 The following channel is now enabled!`,
				description: `<#${channel.id}>`,
			}]}
		}
	}
}).addSubcommand<{
	channel: GuildChannel
}>({
	name: 'disable',
	description: 'disable commands on a channel',
	args: {
		channel: {
			description: 'the channel or category of channels to disable',
			type: 'channel',
			optional: false,
		}
	},
	async execute({channel}, _, {channel: msgChannel}) {
		if (channel.type === 'GUILD_CATEGORY') {
			const channels = (channel as CategoryChannel).children
				.filter(ch => ch.id !== msgChannel?.id)
			disable(...channels.map(channel => channel.id))
			await global.config.save()
			return {embeds: [{
				title: `🔴 The following channels of the category, ${channel.name}, are now disabled!`,
				description: channels.map(channel => `<#${channel.id}>`).join(' '),
			}]}
		} else {
			disable(channel.id)
			await global.config.save()
			return {embeds: [{
				title: `🔴 The following channel is now disabled!`,
				description: `<#${channel.id}>`,
			}]}
		}
	}
})

    // async run(message: CommandoMessage, { status, channels: channelsCollections }: { 
    //     status: string, channels: Collection<string, GuildChannel>[] }) {
    //     let channels = new Collection<string, GuildChannel>().concat(...channelsCollections)
    //     if(status === 'disable') {		// Disable the channels
    //         if(channels.size > 1) channels = channels
    //             .filter(channel => channel.id !== message.channel.id)
    //         Config.disableChannels(...channels.map(channel => channel.id))
    //         return message.embed(await Discord.embed({
    //             title: `🔴 The following channels are now disabled!`,
    //             description: channels.map(channel => `<#${channel.id}>`).join(' ')
    //         }))
    //     } else if(status === 'enable') {	// Enable the channels
    //         Config.enableChannels(...channels.map(channel => channel.id))
    //         return message.embed(await Discord.embed({
    //             title: `🟢 The following channels are now enabled!`,
    //             description: channels.map(channel => `<#${channel.id}>`).join(' ')
    //         }))
    //     } else {	// List the permissions of all channels
    //         return Discord.listChannels(message, 'Channel Perms', ['text', 'news'], channel => 
    //             `${Config.isChannelEnabled(channel.id) ? '🟢' : '🔴'} {channel}`)
    //     }
    // }