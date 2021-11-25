import { oneLine, stripIndents } from 'common-tags'
import { GuildMember } from 'discord.js'
import { createCommand } from '../../bot-framework'

const categories = ['points', 'messages', 'voice', 'daily', 'reps', 'invites', 'bumps', 'counts'] as const

module.exports = createCommand<{
	category?: typeof categories[number],
	member?: GuildMember,
}>({
	name: 'stats',
	description: 'Detailed Stats',
	details: stripIndents`
			Show the detailed leveling stats of someone
			Categories include: ${'`level`, `messages`, `voice`, `daily`, `reps`, `invites`, `bumps`, and `counts`'}
	`,
	aliases: ['stat', 'detail', 'details'],
	type: 'both',
	guildOnly: true,
	args: {
		category: {
			type: 'string',
			description: 'The category of stats to show',
			choices: {
				points: ['points', 'point', 'level', 'levels', 'leveling', 'score', 'scores'],
				messages: ['messages', 'message', 'messaging'],
				voice: ['voice', 'voices', 'vc', 'voicechat', 'talk', 'talking'],
				daily: ['daily', 'streak', 'dailies', 'dailys'],
				reps: ['reps', 'rep', 'reputation'],
				invites: ['invites', 'invite', 'inviting', 'inviter'],
				bumps: ['bumps', 'bump', 'bumping', 'bumper', 'disboard'],
				counts: ['counts', 'count', 'counting', 'counter'],
			},
			optional: true,
		},
		member: {
			type: 'member',
			description: 'The member to get stats of',
			optional: true,
		},
	},
	async execute({ category, member }, reply, { member: authorMember }) {
		if (!member) member = authorMember
		if (!member) return 'Oof! Something went wrong!'

		if(!category) await reply({embeds: [{
			title: `Stats of {member.name}`,
			// thumbnail: { url: '{member.avatar}' },
			fields: [{
				name: 'Level',
				value: `{member.level}`,
				inline: true,
			}].concat(categories.map((category) => { return {
				name: {
					points: 'Points', messages: 'Messages', voice: 'Voice Chat',
					daily: 'Daily', reps: 'Reputation', 
					invites: 'Invites', bumps: 'Bumps', counts: 'Counting',
				}[category],
				value: `{member.${category}}`,
				inline: true,
			}}))
		}]}, {member})
		else await reply({embeds: [{
			title: {
				points: 'Leveling', messages: 'Messaging', voice: 'Voice Chat',
				daily: 'Daily', reps: 'Reputation', 
				invites: 'Invites', bumps: 'Disboard Bumping', counts: 'CountingGame',
			}[category] + ` Stats of {member.name}`,
			// thumbnail: { url: '{member.avatar}' },
			fields: [
				...category === 'points' ? [
					{ name: 'Level', value: '{member.level}' }
				] : category === 'reps' ? [
					{ name: 'Reputation', value: '{member.reps}' },
					{ name: 'Latest', value: stripIndents`
						Given to {member.reps.lastReceiver}
						Received from {member.reps.lastGiver}`}
				] : [],
				{ name: 'All-Time', value: `{member.${category}.alltime}` },
				...!['daily', 'reps', 'bumps', 'counts', 'invites'].includes(category) 
				 ? [{ name: 'Daily', value: `{member.${category}.daily}` }] : [],
				...!['daily', 'invites'].includes(category)
				 ? [{ name: 'Weekly', value: `{member.${category}.weekly}` }] : [],
				{ name: 'Monthly', value: `{member.${category}.monthly}`},
				{ name: 'Annual', value: `{member.${category}.annual}`},
				...category === 'invites'
				 ? [{ name: 'Recent Invites', value: `{member.invites.members.10}`}] : []
			].map(field => { return { ...field, inline: true }})
		}]}, {member})
	}
})