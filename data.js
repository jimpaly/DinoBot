const fs = require('fs')
const private = require('./private.json')
const client = require('./bot').client

// Load data
const data = {}
const dataFiles = fs.readdirSync('./data').filter(file => file.endsWith('.json'))
for (const file of dataFiles) {
	const data1 = require(`./data/${file}`)
	data[data1.name] = data1
}

module.exports = {

	/**
	 * Replaces keys in all properties of an object with data from the client
	 * @param object The object to replace
	 */
	replace(object) {
		if(typeof object === 'string') {
			return replaceStr(object)
		} else if(typeof object !== 'object') {
			return object
		} else if(Array.isArray(object)) {
			let newObject = []
			for(const element of object) {
				newObject.push(module.exports.replace(element))
			}
			return newObject
		} else {
			let newObject = {}
			for(const property in object) {
				newObject[property] = module.exports.replace(object[property])
			}
			return newObject
		}
	},
	/**
	 * Replaces elements of a Discord embed	
	 * @param embed The embed to replace
	 */ 
	replaceEmbed(embed) {
		if(embed.color === undefined) embed.color = '{color}'
		embed = this.replace(embed)
		return embed
	},

	/**
	 * 
	 *  ██████   ███████  ████████ 
	 * ██        ██          ██    
	 * ██   ███  █████       ██    
	 * ██    ██  ██          ██    
	 *  ██████   ███████     ██    
	 * 
	 * Get data stored in the client
	 * @param {string} name The name of the data
	 */
	get(name) {
		switch(name) {
            case 'token': return private.token
            case 'developer': return private.developer
            case 'status': return private.status.message
            case 'statusMode': return {type: private.status.mode}
			case 'prefix': return data['Configuration'].prefix
			case 'disabled': return data['Configuration'].disabled
			case 'color': return data['Configuration'].color
			case 'level.messaging.cooldown': return data['Leveling'].config.messaging.cooldown
			case 'level.messaging': return data['Leveling'].config.messaging.points
			case 'level.voice.cooldown': return data['Leveling'].config.voice.cooldown
			case 'level.voice': return data['Leveling'].config.voice.points
			case 'level.rep.cooldown': return data['Leveling'].config.rep.cooldown
			case 'level.rep.give': return data['Leveling'].config.rep.points.give
			case 'level.rep.recieve': return data['Leveling'].config.rep.points.recieve
			case 'level.bump': return data['Leveling'].config.bump
			case 'level.counting': return data['Leveling'].config.counting
			case 'level.invite': return data['Leveling'].config.invite
			case 'level.members': return Object.keys(data['Leveling'].stats)
			case 'level.leaderboards': return data['Leveling'].live.leaderboards
			case 'level.logs': return data['Leveling'].live.logs
			case 'counting': return data['Counting'].channel
			case 'text': return data['Text'].users
		}

		const args = name.split('.')

		if(args[0] === 'disabled') return data['Configuration'].disabled.includes(args[1])

		// Leveling
		if(/^level\.levels\.((?!\.).)+$/.test(name)) return data['Leveling'].config.levels[args[2]] ?? 0
		if(/^level\.daily\.((?!\.).)+$/.test(name)) return data['Leveling'].config.daily[args[2]] ?? 0
		let stats = data['Leveling'].stats[args[1]]
		if(/^member\.((?!\.).)+\.(points|messages|voice|rep|bumps|counting|invite)(|\.allTime|\.daily|\.weekly|\.monthly|\.annual)$/.test(name)) {
			resetStats(args[1])
			if(['points', 'voice'].includes(args[2])) updateVoice(args[1], undefined)
			const stat = Tools.getSafe(stats, getDefault(args[2], args[3] ?? 'allTime'), args[3] ?? 'allTime', args[2])
			if(args[2] === 'rep' && args[3] === undefined) return stat.recieved - stat.given
			if(args[2] === 'invite' && args[3] === undefined) return stat.joined.length-stat.left.length
			if(args[2] === 'invite' && args[3] === 'allTime') return Tools.mapObject(stat, (value) => value.length)
			return stat
		}
		if(/^member\.((?!\.).)+\.daily(|\.highest|\.current)$/.test(name)) return Tools.getSafe(stats, 0, 'streak', args[3] ?? 'current')
		if(/^member\.((?!\.).)+\.daily\.cooldown$/.test(name)) {
			let offset = this.get(`member.${args[1]}.timezone.offset`)*3600000
			let latest = new Date(Tools.getSafe(stats, 0, 'latest', 'daily') + offset)
			latest.setUTCHours(24, 0, 0)
			return latest.getTime() - Date.now() - offset
		} 
		if(/^member\.((?!\.).)+\.invite\.(joined|left|returned)$/.test(name)) return Tools.getSafe(stats, [], 'allTime', 'invite', args[3])
		if(/^member\.((?!\.).)+\.level$/.test(name)) return pointsToLevel(Tools.getSafe(stats, 0, 'allTime', 'points'))
		if(/^member\.((?!\.).)+\.latest\.(points|voice|daily|rep)$/.test(name)) return Tools.getSafe(stats, 0, 'latest', args[3])
		if(/^member\.((?!\.).)+\.latest\.(repTo|repFrom)$/.test(name)) return Tools.getSafe(stats, "", 'latest', args[3])
		if(/^level\.leaderboard\.((?!\.).)+\.((?!\.).)+\.((?!\.).)+(|\.((?!\.).)+)$/.test(name)) {
			let stat = args[3], time = args[4], option = args[5]
			let memberPlace = ''
			let leaderboard = this.get('level.members').map((otherMember) => {
				let otherStat = this.get(`member.${otherMember}.${stat}.${time}`)
				if(stat === 'rep') {
					if(option === 'given') otherStat = otherStat.given
					else if(option === 'recieved') otherStat = otherStat.recieved
					else otherStat = otherStat.recieved - otherStat.given
				} else if(stat === 'invite') {
					if(option === 'current') otherStat = otherStat.joined - otherStat.left
					else if(option === 'stayed') otherStat = otherStat.joined - otherStat.left - otherStat.returned
					else otherStat = otherStat.joined
				}
				return {
					member: otherMember,
					stat: otherStat
				}
			}).sort((a, b) => b.stat - a.stat).map((memberStat, index) => {
				// TODO: optimize by taking advantage of replaceEmbed (or is this really optimizing?)
				let statStr = memberStat.stat+''
				if(stat === 'voice') statStr = Tools.durationToStr(memberStat.stat, 1, 2)
				let ret = `${index+1}. <@!${memberStat.member}> - ${statStr} `
				ret += [`points`, 'messages', '', 
					option === undefined ? '' : option, 'bumps', 'counts', 'members']
					[['points', 'messages', 'voice', 'rep', 'bumps', 'counting', 'invite'].indexOf(stat)] ?? ''
				if(stat === 'points' && time === 'allTime') ret += ` - lvl ${this.get(`member.${memberStat.member}.level`)}`
				if(memberStat.member === args[2]) {
					memberPlace = ret
					return `**${ret}**`
				} 
				return ret
			})
			leaderboard.unshift(memberPlace)
			return leaderboard
		}

		// Profiles
		let profile = data['Profiles'].profiles[args[1]]
		if(/^member\.((?!\.).)+\.timezone$/.test(name)) return Tools.getSafe(profile, 'Timezone not set', 'timezone')
		if(/^member\.((?!\.).)+\.timezone.offset$/.test(name)) return Tools.getTimezoneOffset(Tools.getSafe(profile, '+0', 'timezone'))
		if(/^member\.((?!\.).)+\.(joinDate|inviter)(|\.latest)$/.test(name)) {
			if(args[2] === 'joinDate') {
				const joinDate = Tools.getSafe(profile, 0, 'joined', 'first')
				if(args[3] === 'latest') return Tools.getSafe(profile, joinDate, 'joined', 'last')
				else return joinDate
			} else if(args[2] === 'inviter') {
				const inviter = Tools.getSafe(profile, 0, 'joined', 'firstInvite')
				if(args[3] === 'latest') return Tools.getSafe(profile, inviter, 'joined', 'lastInvite')
				else return inviter
			}
		}

		if(args[0] === 'text') return data['Text'].users.includes(args[1])
        if(args[0] === 'counting') return data['Counting'].channel === args[1]
	},
	/**
	 * 
	 * ███████  ███████  ████████ 
	 * ██       ██          ██    
	 * ███████  █████       ██    
	 *      ██  ██          ██    
	 * ███████  ███████     ██                   
	 * 
	 * Update data in the client and save it to its file
	 * @param {string} name The name of the data
	 * @param value The new value to set the data to 
	 */
	set(name, value, save = true) {

		const args = name.split('.')

        // Private
		let didUpdate = true;
		switch(name) {
			case 'status': private.status = value; break
			default: didUpdate = false
		} if(didUpdate && save) return Tools.saveJSON(private, './private.json')

		// Configuration
		didUpdate = true;
		switch(name) {
			case 'prefix': data['Configuration'].prefix = value; break
			case 'disabled': data['Configuration'].disabled.push(value); break
			case 'enabled': data['Configuration'].disabled.splice(data['Configuration'].disabled.indexOf(value), 1); break
			case 'color': data['Configuration'].color = value; break
			default: didUpdate = false
		} if(didUpdate && save) return this.save('Configuration')

		// Leveling
		didUpdate = true;
		let stats = data['Leveling'].stats
		if(/^member\.((?!\.).)+\.invite\.(joined|left|returned)\.(add|remove)$/.test(name)) {
			const invites = this.get(`member.${args[1]}.invite.${args[3]}`)
			if(args[4] === 'add') {
				Tools.setSafe(stats, invites.concat(value), args[1], 'allTime', 'invite', args[3])
				for(const category of ['daily', 'weekly', 'monthly', 'annual']) {
					const val = this.get(`member.${args[1]}.invite.${category}`)[args[3]]
					Tools.setSafe(stats, val+1, args[1], category, 'invite', args[3])
				}
			} else if(args[4] === 'remove') {
				const idx = invites.indexOf(value)
				if(idx >= 0) {
					stats[args[1]].allTime.invite[args[3]].splice(idx, 1)
					for(const category of ['daily', 'weekly', 'monthly', 'annual']) {
						const val = this.get(`member.${args[1]}.invite.${category}`)[args[3]]
						Tools.setSafe(stats, val-1, args[1], category, 'invite', args[3])
					}
				} 
			}
		} else if(/^member\.((?!\.).)+\.(points|messages|voice|rep|bumps|counting)(|\.add)$/.test(name)) {
			updateLeaderboards({ stat: args[2] })
			for(const category of ['allTime', 'daily', 'weekly', 'monthly', 'annual']) {
				if(args[3] === 'add') {
					if(args[2] === 'rep') {
						let oldVal = this.get(`member.${args[1]}.${args[2]}.${category}`)
						Tools.setSafe(stats, { 
							given: oldVal.given + (value.given ?? 0), 
							recieved: oldVal.recieved + (value.recieved ?? 0) 
						}, args[1], category, args[2])
					} else {
						Tools.setSafe(stats, this.get(`member.${args[1]}.${args[2]}.${category}`)+value, args[1], category, args[2])
					}
				} else {
					Tools.setSafe(stats, value, args[1], category, args[2])
				}
			}
		} else if(/^member\.((?!\.).)+\.daily(|\.add)$/.test(name)) {
			let highest = this.get(`member.${args[1]}.daily.highest`)
			if(args[3] === 'add') {
				let streak = this.get(`member.${args[1]}.daily.current`)+value
				Tools.setSafe(stats, streak, args[1], 'streak', 'current')
				if(streak > highest) Tools.setSafe(stats, streak, args[1], 'streak', 'highest')
			} else {
				Tools.setSafe(stats, value, args[1], 'streak', 'current')
				if(value > highest) Tools.setSafe(stats, value, args[1], 'streak', 'highest')
			}
		} else if(/^member\.((?!\.).)+\.latest\.(points|voice|daily|rep|repTo|repFrom)$/.test(name)) {
			if(args[3] === 'voice') updateVoice(args[1], value)
			else Tools.setSafe(stats, value, args[1], 'latest', args[3])
		} else if(/^level\.levels\.((?!\.).)+$/.test(name)) {
			data['Leveling'].config.levels[parseInt(args[2])] = value
		} else if(/^level\.daily\.((?!\.).)+$/.test(name)) {
			data['Leveling'].config.daily[parseInt(args[2])] = value
		} else if(/^level\.leaderboard\.((?!\.).)+\.((?!\.).)+$/.test(name)) {
			let exists = false
			for(const lb of this.get('level.leaderboards')) {
				if(lb.channel === args[2] && lb.message === args[3]) {
					Tools.paste(lb, value)
					updateLeaderboards(lb)
					exists = true
					break
				}
			}
			if(!exists) {
				data['Leveling'].live.leaderboards.push(Tools.paste({
					channel: args[2], message: args[3], update: 0
				}, value))
				updateLeaderboards({ channel: args[2], message: args[3] })
			}
		} else if(/^level\.leaderboard\.remove\.((?!\.).)+\.((?!\.).)+$/.test(name)) {
			let lbs = this.get('level.leaderboards')
			for(let i = lbs.length-1; i >= 0; i--) {
				if(lbs[i].channel === args[3] && lbs[i].message === args[4]) {
					lbs.splice(i, 1)
				}
			}
		} else {
			switch(name) {
				case 'level.messaging.cooldown': data['Leveling'].config.messaging.cooldown = value; break
				case 'level.messaging': Tools.paste(data['Leveling'].config.messaging.points, value); break
				case 'level.voice.cooldown': data['Leveling'].config.voice.cooldown = value; break
				case 'level.voice': Tools.paste(data['Leveling'].config.voice.points, value); break
				case 'level.rep.cooldown': data['Leveling'].config.rep.cooldown = value; break
				case 'level.rep.give': data['Leveling'].config.rep.points.give = value; break
				case 'level.rep.recieve': data['Leveling'].config.rep.points.recieve = value; break
				case 'level.bump': data['Leveling'].config.bump = value; break
				case 'level.counting': data['Leveling'].config.counting = value; break
				case 'level.invite': data['Leveling'].config.invite = value; break
				default: didUpdate = false
			}
		} if(didUpdate && save) return this.save('Leveling')

		// Profiles
		didUpdate = true;
		let profiles = data['Profiles'].profiles
		if(/^member\.((?!\.).)+\.join$/.test(name)) {
			if(this.get(`member.${args[1]}.joinDate`) == 0) {
				Tools.setSafe(profiles, Date.now(), args[1], 'joined', 'first')
				Tools.setSafe(profiles, value, args[1], 'joined', 'firstInvite')
			} else {
				Tools.setSafe(profiles, Date.now(), args[1], 'joined', 'last')
				Tools.setSafe(profiles, value, args[1], 'joined', 'lastInvite')
			}
		} else if(/^member\.((?!\.).)+\.timezone$/.test(name)) {
			Tools.setSafe(profiles, value, args[1], 'timezone')
		} else {
			didUpdate = false
		} if(didUpdate && save) return this.save('Profiles')

		// Counting
		didUpdate = true;
		switch(name) {
			case 'counting': data['Counting'].channel = value; break
			default: didUpdate = false
		} if(didUpdate && save) return this.save('Counting')

		// Text
		didUpdate = true;
		switch(name) {
			case 'text.disable': data['Text'].users.push(value); break
			case 'text.enable': data['Text'].users.splice(data['Text'].users.indexOf(value), 1); break
			default: didUpdate = false
		} if(didUpdate && save) return this.save('Text')
	},
	/**
	 * Save data to its file
	 * @param {string} name The name of the data to be saved
	 */
	save(name) {
		Tools.saveJSON(data[name], `./data/${data[name].file}`)
	},

	/**
	 * Check if a member has admin privelages or not
	 * @param {Discord.GuildMember} member The member to check
	 * @returns True if member is admin
	 */
	isAdmin(member) {
		if(member.hasPermission('ADMINISTRATOR')) return true
		if(member.id === private.developer) return true
		return false
	},

};

/**
 * 
 * ██████   ███████  ██████   ██        █████    ██████  ███████ 
 * ██   ██  ██       ██   ██  ██       ██   ██  ██       ██      
 * ██████   █████    ██████   ██       ███████  ██       █████   
 * ██   ██  ██       ██       ██       ██   ██  ██       ██      
 * ██   ██  ███████  ██       ███████  ██   ██   ██████  ███████                                                        
 * 
 * Replaces keys in a string with data from the client
 * @param {string} str The string to replace
 */
function replaceStr(str) {

    if(str === undefined) return;

    //str = str.replace(/\t/gi, '')

    // Configuration (prefix)
    const c = data['Configuration'].prefix.substr(-1)
    if((c>='a'&&c<='z') || (c>='A'&&c<='Z')) {
        str = str.replace(/{prefix}/gi, `${data['Configuration'].prefix} `)
    } else {
        str = str.replace(/{prefix}/gi, data['Configuration'].prefix)
    }
    str = str.replace(/{perm.(.*?)}/gi, (x) => data['Configuration'].disabled.includes(x.slice(6, -1)) ? 'disabled' : 'enabled')
    str = str.replace(/{color}/gi, data['Configuration'].color)

	//Daily
	str = str.replace(/{member\.((?!\.).)+\.daily\.cooldown}/gi, (x) => {
		let cooldown = module.exports.get(x.slice(1, -1))
		return cooldown < 0 ? 'Daily reward is ready!' : Tools.durationToStr(cooldown, 0, 3)
	})
	str = str.replace(/{member\.((?!\.).)+\.daily(|\.current|\.highest)}/gi, (x) => {
		return module.exports.get(x.slice(1, -1))
	})
	//Voice
	str = str.replace(/{member\.((?!\.).)+\.voice(|\.allTime|\.daily|\.weekly|\.monthly|\.annual)}/gi, (x) => {
		return Tools.durationToStr(module.exports.get(x.slice(1, -1)), 1, 2)
	})
	// Rep
	str = str.replace(/{member\.((?!\.).)+\.latest\.(repTo|repFrom)}/gi, (x) => {
		person = module.exports.get(x.slice(1, -1))
		return person === '' ? 'nobody ;-;' : `<@!${person}>`
	})
	str = str.replace(/{member\.((?!\.).)+\.rep\.cooldown}/gi, (x) => {
		let lastGiven = module.exports.get(`${x.slice(1, -14)}.latest.rep`)
		let cooldown = lastGiven + module.exports.get('level.rep.cooldown')*60000 - Date.now()
		return cooldown < 0 ? 'Rep is ready!' : Tools.durationToStr(cooldown, 0, 3)
	})
	str = str.replace(/{member\.((?!\.).)+\.rep\.(allTime|daily|weekly|monthly|annual)}/gi, (x) => {
		rep = module.exports.get(x.slice(1, -1))
		if(typeof rep !== 'object') return rep
		return `${rep.recieved} recieved\n${rep.given} given`
	})
	//Invite
	str = str.replace(/{member\.((?!\.).)+\.invite\.(allTime|daily|weekly|monthly|annual)}/gi, (x) => {
		invite = module.exports.get(x.slice(1, -1))
		return `${invite.joined-invite.left}
				${invite.joined} joined
				${invite.left} left
				${invite.returned} returned`
	})
	str = str.replace(/{member\.((?!\.).)+\.invite\.(joined|left|returned)(|\..+)}/gi, (x) => {
		const args = x.slice(1, -1).split('.')
		people = module.exports.get(x.slice(1, args[4] === undefined ? -1 : (-args[4].length-2)))
		if(people.length === 0) return 'nobody here...'
		return `<@!${people.slice(`-${args[4]}`).join('> <@!')}>`
	})
    //Leveling
    str = str.replace(/{member\.((?!\.).)+\.(points|messages|voice|rep|bumps|counting|invite)(|\.allTime|\.daily|\.weekly|\.monthly|\.annual)}/gi, 
						(x) => module.exports.get(x.slice(1, -1)))
    str = str.replace(/{member\.((?!\.).)+\.level}/gi, (x) => module.exports.get(x.slice(1, -1)))
	str = str.replace(/{level\.(messaging|voice)}/gi, (x) => {
		let points = module.exports.get(x.slice(1, -1))
		if(points.min == points.max) return `${points.max} point${points.max == 1 ? '' : 's'}`
		return `${points.min} to ${points.max} point${points.max == 1 ? '' : 's'}`
	})
	str = str.replace(/{level\.(rep\.give|rep\.recieve|bump|counting|invite)}/gi, (x) => {
		let points = module.exports.get(x.slice(1, -1))
		return `${points} point${points == 1 ? '' : 's'}`
	})
	str = str.replace(/{level\.(daily|levels)\.((?!\.).)+}/gi, (x) => module.exports.get(x.slice(1, -1)))
	str = str.replace(/{level.daily}/gi, (x) => data['Leveling'].config.daily.join(' points, ') + ' rep')
	str = str.replace(/{level\.(messaging|voice|rep)\.cooldown}/gi, (x) => {
		let cooldown = module.exports.get(x.slice(1, -1))
		return `${cooldown} minute${cooldown == 1 ? '' : 's'}`
	})

	// Profile
    str = str.replace(/{member\.((?!\.).)+\.timezone}/gi, (x) => module.exports.get(x.slice(1, -1)))
    str = str.replace(/{member\.((?!\.).)+\.timezone.time}/gi, (x) => {
		let time = Date.now() + Tools.getTimezoneOffset(module.exports.get(x.slice(1, -6))) * 3600000
		return `${Tools.getHour(time, false)}:${Tools.getMinute(time, false)}`
	})
    str = str.replace(/{member\.((?!\.).)+\.timezone.offset}/gi, (x) => {
		let offset = module.exports.get(x.slice(1, -1))
		return (offset < 0 ? '' : '+') + offset + 'h'
	})

    // Fun
    str = str.replace(/{counting}/gi, `<#${data['Counting'].channel}>`)
    str = str.replace(/{text.(.*?)}/gi, (x) => data['Text'].users.includes(x.slice(6, -1)) ? 'disabled' : 'enabled')
    
    return str
}

function pointsToLevel(points) {
    return Math.floor(points/100)
}
function levelToPoints(level) {
    return level*100
}

function resetStats(member) {
	let lastUpdate = Tools.getSafe(data['Leveling'].stats, Date.now(), member, 'lastUpdate'); 
	for(const stat of ['points', 'messages', 'voice', 'rep', 'bumps', 'counting', 'invite']) {
		let date = new Date()
		date.setHours(0, 0, 0); if(lastUpdate < date.getTime()) {
			Tools.setSafe(data['Leveling'].stats, getDefault(stat), member, 'daily', stat)
			updateLeaderboards({ stat: stat, time: 'daily' })
		} Tools.setDay(date); if(lastUpdate < date.getTime()) {
			Tools.setSafe(data['Leveling'].stats, getDefault(stat), member, 'weekly', stat)
			updateLeaderboards({ stat: stat, time: 'weekly' })
		} date.setDate(1); if(lastUpdate < date.getTime()) {
			Tools.setSafe(data['Leveling'].stats, getDefault(stat), member, 'monthly', stat)
			updateLeaderboards({ stat: stat, time: 'monthly' })
		} date.setMonth(0); if(lastUpdate < date.getTime()) {
			Tools.setSafe(data['Leveling'].stats, getDefault(stat), member, 'annual', stat)
			updateLeaderboards({ stat: stat, time: 'annual' })
		}
	}
	Tools.setSafe(data['Leveling'].stats, Date.now(), member, 'lastUpdate')
}

function getDefault(stat, category = 'not allTime') {
	if(stat === 'rep') return { given: 0, recieved: 1 }
	if(stat === 'invite' && category === 'allTime') return { joined: [], left: [], returned: [] }
	if(stat === 'invite') return { joined: 0, left: 0, returned: 0 }
	return 0
}

// I have no idea what I did here but at least it works man
function updateVoice(member, isRecording) {

	let latest = Tools.getSafe(data['Leveling'].stats, 0, member, 'latest', 'voice')
	let now = Date.now()
	if(Math.abs(now - latest) < 10) return
	if(isRecording === undefined) isRecording = latest > 0

	if(latest <= 0 && isRecording) {	// Starting recording
		// console.log(`started recording at ${date(now)}`)
		module.exports.set(`member.${member}.latest.points`, now + latest, false)
		Tools.setSafe(data['Leveling'].stats, now, member, 'latest', 'voice') 
	} else if(latest > 0) {
		let time = Tools.getSafe(data['Leveling'].stats, 0, member, 'latest', 'points')
		let cooldown = Math.max(1, data['Leveling'].config.voice.cooldown)*60000
		let pointsGain = 0
		for(; time < now - cooldown; time += cooldown) {
			// console.log(`collecting points: ${pointsGain} (${time} ${now - cooldown})`)
			pointsGain += Tools.randomRange(data['Leveling'].config.voice.points)
		}
		if(!isRecording) {	// Stop recording
			// console.log(`stopped recording at ${date(now)}`)
			Tools.setSafe(data['Leveling'].stats, time - now, member, 'latest', 'voice') 
		} else {	// Continue recording
			// console.log(`updated recording at ${date(now)}`)
			Tools.setSafe(data['Leveling'].stats, now, member, 'latest', 'voice') 
		}
		// console.log(`updating data... ${now} ${latest}`)
		module.exports.set(`member.${member}.latest.points`, time, false)
		module.exports.set(`member.${member}.voice.add`, now - latest, false)
		module.exports.set(`member.${member}.points.add`, pointsGain, false)
	}
}

function updateLeaderboards(filter) {
	let removed = []
	for(const lb of module.exports.get('level.leaderboards').filter((lb) => {
		if(Date.now() - lb.update < 5000) return false
		for(const key of Object.keys(filter)) if(filter[key] !== lb[key]) return false
		return true
	})) {
		lb.update = Date.now()
		let leaderboard = module.exports.get(`level.leaderboard.0.${lb.stat}.${lb.time}`).slice(1, lb.count+1)
		let embed = {
			title: 'Leveling System!',
			description: `Welcome to the server's leveling system! Stay active to earn points and level up!

						> To get started, you don't really need to think much. I'll reward you points when you send messages or spend time in voice chats. It's as simple as that!
						
						> Of course, there are some other cool ways you can earn points as well, whether by inviting people, bumping our server with <@!302050872383242240>, or with the \`{prefix}daily\` command. But if you're new, just relax and have fun :)
						
						——————

						**Live ${['','Daily','Weekly','Monthly','Annual'][['allTime','daily','weekly','monthly','annual'].indexOf(lb.time)]}` +
		`${['','Messaging','Voice Chat','Reputation','Bumping','Counting','Invite'][['points','messages','voice','rep','bumps','counting','invite'].indexOf(lb.stat)]} Leaderboard**`,
			timestamp: lb.update
		}
		Tools.getMessage(client, lb.channel, lb.message).then((message) => {
			if(message === undefined) return removed.push({ channel: lb.channel, message: lb.message })
			Tools.pageList(message, -1, lb.count, leaderboard, embed)
		})
	}
	for(const lb in removed) module.exports.set(`level.leaderboard.remove.${lb.channel}.${lb.message}`)
}


function logStat(message) {

}


const Tools = require('./tools')