import { CategoryChannel, GuildChannel, MessageEmbedOptions } from "discord.js"
import { ChannelTypes } from "discord.js/typings/enums"

type ChannelType = keyof typeof ChannelTypes

/** Creates an embed listing all channels in the guild in an organized fashion */
export async function listChannels(title: string, filter: ChannelType[] = [
	'GUILD_TEXT', 'GUILD_NEWS', 'GUILD_VOICE', 'GUILD_STAGE_VOICE'
], channelStrBuilder: (channel: GuildChannel) => string): Promise<MessageEmbedOptions> {

	const sort = (a: GuildChannel, b: GuildChannel) => {
		if(a.type === b.type) return a.position - b.position
		if(a.isVoice()) return 1
		return -1
	}

	let allChannels = Array.from(global.guild.channels.cache, ([_, val]) => val).sort(sort)
	return {
		title: title,
		description: allChannels
			.filter(channel => !channel.isThread() && filter.includes(channel.type) && channel.parent === null)
			.map(channelStrBuilder).join('\n'),
		fields: allChannels
			.filter(channel => channel.type === 'GUILD_CATEGORY')
			.map((channel: CategoryChannel) => { return {
				name: `${channel.name}`,
				inline: true,
				value: Array.from(channel.children, ([_, val]) => val).sort(sort)
					.filter((channel) => !channel.isThread() && filter.includes(channel.type))
					.map(channelStrBuilder).join('\n')
			}})
	}
}