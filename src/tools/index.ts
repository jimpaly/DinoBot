import { stripIndents } from "common-tags"
import { Awaitable, CategoryChannel, GuildChannel, GuildMember, Message, MessageEmbedOptions, User } from "discord.js"
import { ChannelTypes, MessageComponentTypes } from "discord.js/typings/enums"
import { MemberStats } from "../database"
import * as Time from './time'

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

interface NavigationItem {
	name: string,
	description: string,
	placeholder?: string,
	subItems?: NavigationItem[]
}
/** creates a message where users can navigate through pages by clicking through discord select menus */
export async function makeNavigator(message: Message, items: NavigationItem[], 
builder: (item: string, level: number) => Awaitable<MessageEmbedOptions>) {

	function makeMenu(id: string, items: NavigationItem[], placeholder?: string, selected?: string) {
		return {
			type: MessageComponentTypes.ACTION_ROW,
			components: [{
				type: MessageComponentTypes.SELECT_MENU,
				customId: id,
				placeholder,
				options: items.map((item, index) => {return {
					label: item.name,
					description: item.description,
					value: `${index}`,
					default: item.name === selected
				}})
			}]
		}
	}

	const navigationStack = [items[0]]

	async function updateMessage() {
		return {
			embeds: [await builder(navigationStack[navigationStack.length-1].name, navigationStack.length-1)],
			components: [makeMenu('0', items, undefined, navigationStack[0].name)]
				.concat(navigationStack.filter(item => item.subItems).map((item, index) => 
					makeMenu(`${index+1}`, item.subItems ?? [], item.placeholder, navigationStack[index+1]?.name)))
		}
	}

	message.edit(await updateMessage())

	message.createMessageComponentCollector({componentType: 'SELECT_MENU', idle: 60000, })
	.on('collect', async interaction => {
		while(navigationStack.length > Number(interaction.customId)) navigationStack.pop()
		const subItems = navigationStack.length > 0 ? navigationStack[navigationStack.length-1].subItems : items
		if (subItems) navigationStack.push(subItems[Number(interaction.values[0])])
		interaction.update(await updateMessage())
	}).once('end', interactions => {
		message.components.forEach(row => row.components.forEach(component => component.setDisabled(true)))
		message.edit({ components: message.components })
	})
}

/** check if a string is in an array */
export function isType<T extends string>(str: string, arr: readonly T[]): str is T {
	return (arr as readonly string[]).includes(str)
}

export { replaceTags } from './replace'