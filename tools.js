//jshint esversion: 6

const Discord = require('discord.js')
const fs = require('fs')
const private = require('./private.json')
const Data = require('./bot.js')

module.exports = {

	// Error message sending
    fault(channel, message) {
        channel.send(
            new Discord.MessageEmbed()
            .setTitle('OOPS!')
            .setDescription(Data.replace(message))
        )
    },
    error(channel, err) {
        channel.send(
            new Discord.MessageEmbed()
            .setTitle('OOF!')
            .setDescription('I seem to be having a problem... Don\'t worry, this isn\'t your fault.')
        )
        console.error(err)
    },

	/**
	 * Sets the status of the bot
	 * @param {Discord.Client} client The bot client
	 */
	setActivityStatus(client) {
		client.user.setActivity(private.status.message, {type: private.status.mode})
	},
	/**
	 * Get the private bot token
	 * @returns {string} The token
	 */
	getBotToken() {
		return private.token
	},

	/**
	 * Checks if a channel is enabled for the bot
	 * @param {Discord.Client} client The bot client which holds the config data
	 * @param {Discord.Channel} channel The channel to check
	 * @returns {boolean} True if the channel is enabled
	 */
	isChannelEnabled(client, channel) {
		return client.data.get('Configuration').disabled.includes(channel.id)
	},
	isAdmin(member) {
		if(member.hasPermission('ADMINISTRATOR')) return true
		if(member.id === 'MY_USER_ID') return true
		return false
	},

	/**
	 * Replaces keys in a string with data from the client
	 * @param {Discord.Client} client The bot client
	 * @param {string} str The string to replace
	 */
	replace(client, str) {

		if(str === undefined) return;

		// Configuration (prefix)
		data = client.data.get('Configuration')
		const c = data.prefix.substr(-1)
		if((c>='a'&&c<='z') || (c>='A'&&c<='Z')) {
			str = str.replace(/{prefix}/gi, `${data.prefix} `)
		} else {
			str = str.replace(/{prefix}/gi, data.prefix)
		}

		// Minigames
		data = client.data.get('Minigames')
		str = str.replace(/{minigames.counting}/gi, `<#${data.counting.channel}`)

		// {counting.channel} LEGACY
		// str = str.replace(/{counting.channel}/gi, `<#${client.data.counting.channel}>`);
		// str = str.replace(/{counting.reward}/gi, `<#${counting.reward}>`);
		// str = str.replace(/{counting.decrease}/gi, `<#${counting.decrease}>`);
		return str
	},
	/**
	 * Replaces keys in all properties of an object with data from the client
	 * @param {Discord.Client} client The bot client
	 * @param object The object to replace
	 */
	replaceObject(client, object) {
		if(typeof object === 'string') {
			return module.exports.replace(client, object)
		} else if(typeof object !== 'object') {
			return object
		} else if(Array.isArray(object)) {
			var newObject = []
			for(var element of object) {
				newObject = newObject.concat(module.exports.replaceObject(client, element))
			}
			return newObject
		} else {
			var newObject = {}
			for(var property in object) {
				newObject[property] = module.exports.replaceObject(client, object[property])
			}
			return newObject
		}
	}, 

	/**
	 * Get data stored in the client
	 * @param {Discord.Client} client The bot client
	 * @param {string} name The name of the data
	 */
	getData(client, name) {

		// Configuration
		data = client.data.get('Configuration')
		switch(name) {
			case 'prefix': return data.prefix
		}

		// Minigames
		data = client.data.get('Minigames')
		switch(name) {
			case 'minigames.counting': return data.counting.channel
		}
	},
	/**
	 * Update data in the client and save it to its file
	 * @param {Discord.Client} client The bot client
	 * @param {string} name The name of the data
	 * @param value The new value to set the data to 
	 */
	setData(client, name, value) {

		// Configuration
		data = client.data.get('Configuration')
		didUpdate = true;
		switch(name) {
			case 'prefix': data.prefix = value; break
			default: didUpdate = false
		}
		if(didUpdate) {
			client.data.set('Configuration', data)
			module.exports.saveData(client, 'Configuration')
			return
		}

		// Minigames
		data = client.data.get('Minigames')
		didUpdate = true;
		switch(name) {
			case 'minigames.counting': data.counting.channel = value; break
			default: didUpdate = false
		}
		if(didUpdate) {
			client.data.set('Minigames', data)
			module.exports.saveData(client, 'Minigames')
			return
		}
	},

	/**
	 * Save data to its file
	 * @param {Discord.Client} client The bot client
	 * @param {string} name The name of the data to be saved
	 */
	saveData(client, name) {
		let data = client.data.get(name)
		module.exports.saveJSON(data, `./data/${data.file}`)
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


	success(channel, message) {
		channel.send({ embed: {
			title: 'Success!',
			description: message
		}})
	},
    exists(variable) {
        return typeof variable !== 'undefined';
    },

	equalStr(str, opt) {
		if(!module.exports.exists(str)) return false;
		options = opt.split(' ');
		for(var option of options) {
			if(str.toLowerCase() === option.toLowerCase()) return true;
		}
		return false;
	},
	combine(elements, delim) {
		str = ''
		for(var element of elements) {
			str += element + delim;
		}
		return str.slice(0, str.length-delim.length).trim();
	},
	slice(str, opt) {
		options = opt.replace(/{prefix}/gi, config.prefix).split(' ');
		for(var option of options) {
			str = str.trim().slice(option.length);
		}
		return str.trim();
	},
	numPostfix(num) {
		if(Math.floor(num%100/10) == 1) return `${num}th`;
		if(num%10 == 1) return `${num}st`;
		if(num%10 == 2) return `${num}nd`;
		if(num%10 == 3) return `${num}rd`;
		return `${num}th`;
	},
	percent(num) {
		if(isNaN(num)) return '0%'
		return `${Math.round(num*100)}%`;
	},
	addSign(num) {
		return num<0 ? `${num}` : `+${num}`;
	},

	getMessage(client, channel, message, callback) {
		client.channels.fetch(channel).then(ch => {
			ch.messages.fetch(message).then(msg => {
				callback(msg);
			});
		});
	},
	getURL(guild, channel, message) {
		return 'https://discordapp.com/channels/'+guild+'/'+channel+'/'+message;
	},

	random(min, max) {
		return Math.floor(Math.random() * (max+1-min)) + min;
	},
	sum(array, property) {
		sum = 0;
		for(let num of array.map(element => element[property])) sum += num;
		return sum;
	}

};
