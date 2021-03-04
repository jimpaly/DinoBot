//Data Manager
module.exports = {

	getAllData() { return data },
	getAllCommands() { return commands },

	/**
	 * Replaces keys in a string with data from the client
	 * @param {string} str The string to replace
	 */
	replaceStr(str) {

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

		// Fun
		str = str.replace(/{counting}/gi, `<#${data['Counting'].channel}>`)
		str = str.replace(/{text.(.*?)}/gi, (x) => data['Text'].users.includes(x.slice(6, -1)) ? 'disabled' : 'enabled')
		
		return str
	},
	/**
	 * Replaces keys in all properties of an object with data from the client
	 * @param object The object to replace
	 */
	replace(object) {
		if(typeof object === 'string') {
			return module.exports.replaceStr(object)
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
	getData(name) {
		switch(name) {
			case 'prefix': return data['Configuration'].prefix
			case 'disabled': return data['Configuration'].disabled
			case 'color': return data['Configuration'].color
			case 'counting': return data['Counting'].channel
			case 'text': return data['Text'].users
		}
		if(name.startsWith('disabled.')) return data['Configuration'].disabled.includes(name.slice(9))
		if(name.startsWith('text.')) return data['Text'].users.includes(name.slice(5))
	},
	/**
	 * Update data in the client and save it to its file
	 * @param {string} name The name of the data
	 * @param value The new value to set the data to 
	 */
	setData(name, value) {

		// Configuration
		didUpdate = true;
		switch(name) {
			case 'prefix': data['Configuration'].prefix = value; break
			case 'disabled': data['Configuration'].disabled.push(value); break
			case 'enabled': data['Configuration'].disabled.splice(data['Configuration'].disabled.indexOf(value), 1); break
			case 'color': data['Configuration'].color = value; break
			default: didUpdate = false
		} if(didUpdate) return module.exports.saveData('Configuration')

		// Counting
		didUpdate = true;
		switch(name) {
			case 'counting': data['Counting'].channel = value; break
			default: didUpdate = false
		} if(didUpdate) return module.exports.saveData('Counting')

		// Text
		didUpdate = true;
		switch(name) {
			case 'text.disable': data['Text'].users.push(value); break
			case 'text.enable': data['Text'].users.splice(data['Text'].users.indexOf(value), 1); break
			default: didUpdate = false
		} if(didUpdate) return module.exports.saveData('Text')
	},

	/**
	 * Save data to its file
	 * @param {string} name The name of the data to be saved
	 */
	saveData(name) {
		module.exports.saveJSON(data[name], `./data/${data[name].file}`)
	},
	/**
	 * Save an object to a specified file
	 * @param object The object to be saved
	 * @param {string} file The file name to save to
	 */
	saveJSON(object, file) {
		fs.writeFile(file, JSON.stringify(object, null, 2), (err) => {
			if (err) console.log(`fault writing file ${file}:`, err)
		})
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
	}

};

/*
		  ██████  ██ ███    ██  ██████  ██████   ██████  ████████ 
		  ██   ██ ██ ████   ██ ██    ██ ██   ██ ██    ██    ██    
		  ██   ██ ██ ██ ██  ██ ██    ██ ██████  ██    ██    ██    
		  ██   ██ ██ ██  ██ ██ ██    ██ ██   ██ ██    ██    ██    
		  ██████  ██ ██   ████  ██████  ██████   ██████     ██    
*/



const Discord = require('discord.js')
const fs = require('fs')
const Tools = require('./tools.js')
const private = require('./private.json')

// Start Discord client
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] })
client.login(private.token)

// Load commands
const commands = {}
for (const file of ['utility', 'fun']) {
	const command = require(`./commands/${file}`)
	commands[command.name] = command
}

// Load data
const data = {}
const dataFiles = fs.readdirSync('./data').filter(file => file.endsWith('.json'))
for (const file of dataFiles) {
	const data1 = require(`./data/${file}`)
	data[data1.name] = data1
}

// When the bot starts...
client.once('ready', () => {
	client.user.setActivity(private.status.message, {type: private.status.mode})
	console.log(`DinoBot logged in as @${client.user.tag}`)
});


// When a message is sent...
client.on('message', message => {

	// Initial checks
	if(message.author.id === client.user.id) return
	if(data['Configuration'].disabled.includes(message.channel.id)) return
	message.content = message.content.trim()

	// Check if it's a command or not
	if(message.content.startsWith(data['Configuration'].prefix)) {
		args = message.content.slice(data['Configuration'].prefix.length).trim().split(/\s+/)
	} else if(message.content.startsWith('<@!'+client.user.id+'>')) {
		args = message.content.slice(client.user.id.length+4).trim().split(/\s+/)
	} else {
		if(message.channel.type === 'text') {
			if(data['Counting'].channel === message.channel.id) return commands['Fun'].count(message)
			commands['Fun'].react(message)
		} return
	}

	if(message.author.bot) return
	if(message.author.id === private.developer && devCommands(message, args)) return
	// Process command
	for(const category in commands) {
		for(const command of commands[category].commands) {
			if (!command.alias.includes(args[0].toLowerCase())) {
			} else if(command.guildOnly && message.channel.type === 'dm') {
				Tools.fault(message.channel, 'It seems like that command can\'t be used in DMs!');
			} else if(command.developer && message.member.id !== 'MY_USER_ID') {
			} else if(!command.public && !message.member.hasPermission('ADMINISTRATOR') && message.member.id !== 'MY_USER_ID') {
			} else {
				try { command.execute(message, args.slice(1)); }
				catch (err) { Tools.error(message.channel, err); return; }
				break;
			}
		}
	}
});

function devCommands(message, args) {
	if(args[0] === 'setActivity') {
		private.status.mode = args[1]
		private.status.message = args.slice(2).join(' ')
		module.exports.saveJSON(private, './private.json')
		client.user.setActivity(private.status.message, {type: private.status.mode})
		return true;
	}
}