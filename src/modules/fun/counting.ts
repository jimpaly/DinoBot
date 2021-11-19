import { stripIndents } from 'common-tags'
import { GuildChannel } from 'discord.js'
import { builtinModules } from 'module'
import { createCommand } from '../../bot-framework'

module.exports = createCommand<{
	channel?: GuildChannel,
}>({
	name: 'counting',
	description: 'Play the counting game!',
	details: stripIndents`
			Play the counting game in {counting.channel}!
			This command is used to set that counting channel.
	`,
	aliases: ['count', 'counts', 'counter'],
	guildOnly: true,
	permission: 'admin',
	type: 'both',
	args: {
		channel: {
			description: 'The channel to play the counting game in',
			type: 'channel',
			optional: true,
		}
	},
	async execute({channel}) {
		if(channel) {
		    global.config.counting = channel.id
				await global.config.save()
		}
		return {embeds: [{
			description: `Counting channel set to: <#${global.config.counting}>`
		}]}
	}
})