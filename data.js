const fs = require('fs')
const Tools = require('./tools')
const private = require('./private.json')

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
			case 'messageCooldown': return data['Leveling'].config.messaging.cooldown
			case 'messagePoints': return data['Leveling'].config.messaging.points
			case 'voiceCooldown': return data['Leveling'].config.voice.cooldown
			case 'voicePoints': return data['Leveling'].config.voice.points
			case 'levels.messageCooldown': return data['Leveling'].config.messaging.cooldown
			case 'counting': return data['Counting'].channel
			case 'text': return data['Text'].users
		}

		const args = name.split('.')

		if(args[0] === 'disabled') return data['Configuration'].disabled.includes(args[1])

        let member = args[1]
        if(data['Leveling'].levels[args[1]] === undefined) member = 'template'
		if(/^member\.(.+)\.stats$/.test(name)) 
			return Tools.clone(data['Leveling'].levels[member])
		if(/^member\.(.+)\.(points|rep|money|messages|voice|bumps|counting)(|\.allTime|\.daily|\.weekly|\.monthly|\.annual)$/.test(name))
			return data['Leveling'].levels[member][args[3] ?? 'allTime'][args[2]] ?? 0
		if(/^member\.(.+)\.level$/.test(name)) 
			return pointsToLevel(data['Leveling'].levels[member].allTime.points ?? 0)

		if(args[0] === 'text') return data['Text'].users.includes(args[1])
        if(args[0] === 'counting') return data['Counting'].channel === args[1]
	},
	/**
	 * Update data in the client and save it to its file
	 * @param {string} name The name of the data
	 * @param value The new value to set the data to 
	 */
	set(name, value) {

		const args = name.split('.')

        // Private
		didUpdate = true;
		switch(name) {
			case 'status': private.status = value; break
			default: didUpdate = false
		} if(didUpdate) return Tools.saveJSON(private, './private.json')

		// Configuration
		didUpdate = true;
		switch(name) {
			case 'prefix': data['Configuration'].prefix = value; break
			case 'disabled': data['Configuration'].disabled.push(value); break
			case 'enabled': data['Configuration'].disabled.splice(data['Configuration'].disabled.indexOf(value), 1); break
			case 'color': data['Configuration'].color = value; break
			default: didUpdate = false
		} if(didUpdate) return saveData('Configuration')

		// Leveling
		didUpdate = true;
		if(/member\.(.+)\.stats/.test(name)) {
			data['Leveling'].levels[args[1]] = value
		} else {
			didUpdate = false
		} if(didUpdate) return saveData('Leveling')

		// Counting
		didUpdate = true;
		switch(name) {
			case 'counting': data['Counting'].channel = value; break
			default: didUpdate = false
		} if(didUpdate) return saveData('Counting')

		// Text
		didUpdate = true;
		switch(name) {
			case 'text.disable': data['Text'].users.push(value); break
			case 'text.enable': data['Text'].users.splice(data['Text'].users.indexOf(value), 1); break
			default: didUpdate = false
		} if(didUpdate) return saveData('Text')
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
 * Replaces keys in a string with data from the client
 * @param {string} str The string to replace
 */
function replaceStr(str) {

    if(str === undefined) return;

    str = str.replace(/\t/gi, '')

    // Configuration (prefix)
    const c = data['Configuration'].prefix.substr(-1)
    if((c>='a'&&c<='z') || (c>='A'&&c<='Z')) {
        str = str.replace(/{prefix}/gi, `${data['Configuration'].prefix} `)
    } else {
        str = str.replace(/{prefix}/gi, data['Configuration'].prefix)
    }
    str = str.replace(/{perm.(.*?)}/gi, (x) => data['Configuration'].disabled.includes(x.slice(6, -1)) ? 'disabled' : 'enabled')
    str = str.replace(/{color}/gi, data['Configuration'].color)

    //Leveling
    str = str.replace(/{member\.(.+)\.points(|\.allTime|\.daily|\.weekly|\.monthly|\.annual)}/gi, (x) => module.exports.get(x.slice(1, -1)))
    str = str.replace(/{member\.(.+)\.level}/gi, (x) => module.exports.get(x.slice(1, -1)))

    // Fun
    str = str.replace(/{counting}/gi, `<#${data['Counting'].channel}>`)
    str = str.replace(/{text.(.*?)}/gi, (x) => data['Text'].users.includes(x.slice(6, -1)) ? 'disabled' : 'enabled')
    
    return str
}

/**
 * Save data to its file
 * @param {string} name The name of the data to be saved
 */
function saveData(name) {
    Tools.saveJSON(data[name], `./data/${data[name].file}`)
}

function pointsToLevel(points) {
    return Math.floor(points/100)
}
function levelToPoints(level) {
    return level*100
}