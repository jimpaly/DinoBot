import { stripIndents } from "common-tags"
import { GuildMember, User } from "discord.js"
import { isType } from "."
import { MemberStats } from "../database"
import * as Time from './time'

/** recursively runs a replace function on all strings in an object */
function replaceInObject(object: any, replaceFunction: (str: string) => string): any {
	if(typeof object === 'string') {
			return replaceFunction(object)
	} else if(typeof object !== 'object') {
			return object
	} else if(Array.isArray(object)) {
			let newObject = []
			for(const element of object) {
					newObject.push(replaceInObject(element, replaceFunction))
			}
			return newObject
	} else {
			let newObject: any = {}
			for(const property in object) {
					newObject[property] = replaceInObject(object[property], replaceFunction)
			}
			return newObject
	}
}
/** Replace tags in a string conditionally with args */
function replaceTagsInString(str: string, replaceFunction: (args: string[]) => string | null | undefined) {
	for(const match of str.match(/{.[^{}]+}/gi) ?? []) {
		const args = match.slice(1, -1).split('.')
		str = str.replace(match, replaceFunction(args) ?? match)
	}
	return str
}


function memberReplace(args: string[], { id, stats }: {
	id: string
	stats: MemberStats.Document
}): string | undefined {
	if (args.length == 0) {
		return `<@!${id}>`
	} else if(args[0] === 'level') {
		return `${1}` // stats.getLevel()
	} else if (isType(args[0], ['points', 'bumps', 'counts'])) {
		args[1] ??= 'alltime'
		if (MemberStats.isTimePeriod(args[1])) return `${stats[args[0]][args[1]]}`
	} else if (args[0] === 'messages') {
		args[1] ??= 'alltime'
		if (MemberStats.isTimePeriod(args[1])) return `${stats[args[0]].amount[args[1]]}`
	} else if (args[0] === 'voice') {
		args[1] ??= 'alltime'
		if (MemberStats.isTimePeriod(args[1])) return Time.durationToStr(stats.voice.duration[args[1]])
	} else if (args[0] === 'daily') {
		args[1] ??= 'alltime'
		if (MemberStats.isTimePeriod(args[1])) return stripIndents`
			${args[1] === 'alltime' ? stats.daily.current : ''}
			${stats.daily.highest[args[1]]} highest
			${stats.daily.total[args[1]]} total`
		else if (args[1] === 'current') return `${stats.daily.current}`
		else if (args[1] === 'highest' || args[1] === 'total') {
			args[2] ??= 'alltime'
			if (MemberStats.isTimePeriod(args[2])) return `${stats.daily[args[1]][args[2]]}`
		} else if (args[1] === 'cooldown') {
			Time.durationToStr(stats.getDailyCooldown(), 0, 2)
		}
	} else if(args[0] === 'reps') {
		args[1] ??= 'received'
		if(MemberStats.isTimePeriod(args[1])) return stripIndents`
			${stats.reps.received[args[1]]} received
			${stats.reps.given[args[1]]} given`
		else if (args[1] === 'stored') return `${stats.reps.stored}`
		else if(isType(args[1], ['given', 'received'])) {
			args[2] ??= 'alltime'
			if (MemberStats.isTimePeriod(args[2])) return `${stats.reps[args[1]][args[2]]}`
		} else if(isType(args[1], ['lastGiver', 'lastReceiver'])) {
			let person = stats.reps[args[1]]
			return person ? `<@!${person}>` : 'nobody ;-;'
		} else if(args[1] === 'cooldown') {
			Time.durationToStr(stats.getRepCooldown(), 0, 2)
		} 
	} else if(args[0] === 'invites') {
		if (args.length < 2) return `${stats.invites.joins.alltime-stats.invites.leaves.alltime}`
		else if (MemberStats.isTimePeriod(args[1])) return stripIndents`
			${stats.invites.joins[args[1]]-stats.invites.leaves[args[1]]}
			${stats.invites.joins[args[1]]} joined
			${stats.invites.leaves[args[1]]} left
			${stats.invites.returns[args[1]]} returned`
		else if(isType(args[1], ['joins', 'leaves', 'returns'])) {
			args[2] ??= 'alltime'
			if (MemberStats.isTimePeriod(args[2])) return `${stats.invites[args[1]][args[2]]}`
		} else if(isType(args[1], ['here', 'stayed'])) {
			args[2] ??= 'alltime'
			if (MemberStats.isTimePeriod(args[2])) {
				let invites = stats.invites.joins[args[2]] - stats.invites.leaves[args[2]]
				if (args[1] === 'stayed') invites -= stats.invites.returns[args[2]]
				return `${invites}`
			}
		} else if (args[1] === 'members') {
			const count = parseInt(args[2])
			if (isNaN(count)) return `<@!${stats.invites.members.slice(-count).join('> <@!')}>`
		}
	}
}

export async function replaceTags(object: any, {member, user}: {
	member?: GuildMember,
	user: User,
}): Promise<any> {
	const stats = await global.database.stats.getStats(member?.id ?? user.id)
	return replaceInObject(object, str => {
		str = replaceTagsInString(str, args => {
			if (args.length == 0) return
			const key = args.splice(0, 1)[0]
			if (key === 'member') return memberReplace(args, { 
				id: member?.id ?? user.id, 
				stats: stats
			})
		})
		return str
	})	
}