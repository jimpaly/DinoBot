const Discord = require('discord.js')
const fs = require('fs')
const private = require('./private.json')
const Data = require('./data')
const Canvas = require('canvas')

module.exports = {

	/**
	 * Send a message when a person messes up when interacting with the bot
	 * @param {Discord.TextChannel} channel The channel to send the message to
	 * @param {string} message The message to send
	 */
    fault(channel, message) {
		if(channel === undefined) return;
        channel.send(
            new Discord.MessageEmbed()
            .setTitle('OOPS!')
            .setDescription(Data.replace(message))
        )
    },
	/**
	 * Send a notice when an error occurs
	 * @param {Discord.TextChannel} channel The channel to send the error to
	 * @param err The error
	 */
    error(channel, err) {
        channel.send(
            new Discord.MessageEmbed()
            .setTitle('OOF!')
            .setDescription('I seem to be having a problem... Don\'t worry, this isn\'t your fault.')
        )
        console.error(err)
    },

	
	createColorImage(color, width, height) {

		const canvas = Canvas.createCanvas(width, height)
		const ctx = canvas.getContext('2d')

		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.font = `bold ${height/2}px Courier New`

		if(this.isHex(color)) {
			ctx.fillStyle = color
			ctx.fillRect(0, 0, width, height)
	
			const rgb = this.hexToRgb(color)
			ctx.fillStyle = (rgb.r*0.299 + rgb.g*0.587 + rgb.b*0.114) > 186 ? '#000000' : '#ffffff'
			ctx.fillText(color, width/2, height/2)
		} else {
			ctx.fillStyle = '#000000'
			ctx.fillRect(0, 0, width, height)
			ctx.fillStyle = '#ffffff'
			ctx.fillText('COLOR NOT SET', width/2, height/2)
		}

		return canvas.toBuffer()
	},
	/**
	 * Checks if a hex string is a good color
	 * @param {string} color The hex string to check
	 * @returns True if the string is formatted correctly
	 */
	isHex(color) {
		return color.startsWith('#') && /^[0-9a-f]+$/.test(color.slice(1))
	},
	/**
	 * Parse a hex string to the format the bot uses
	 * @param {string} color The color string to parse
	 */
	parseHex(color) {
		if(!color.startsWith('#')) color = '#'+color
		if(/^[0-9a-f]+$/i.test(color.slice(1))) return color.toLowerCase()
		return ""
	},
	rgbToHex(r, g, b) {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	},
	hexToRgb(hex) {
		return {
			r: parseInt(hex.slice(1, 3), 16),
			g: parseInt(hex.slice(3, 5), 16),
			b: parseInt(hex.slice(5, 7), 16)
		}
	},


	matchArgs(args, match) {
		for(const i in args) {
			if(match[i] === undefined || match[i] === '*') continue
			if(Array.isArray(match[i]) && match[i].includes(args[i])) return false
			if(!Array.isArray(match[i]) && match[i] === args[i]) return false
		}
		return true
	},


	/**
	 * Save an object to a specified file
	 * @param object The object to be saved
	 * @param {string} file The file name to save to
	 */
	saveJSON(object, file) {
		fs.writeFile(file, JSON.stringify(object, null, 4), (err) => {
			if (err) console.log(`fault writing file ${file}:`, err)
		})
	},

	/**
	 * Copies all properties of an object to a new object
	 * @param object The object to clone
	 */
	clone(object) {
		if(typeof object !== 'object') {
			return object
		} else if(Array.isArray(object)) {
			let newObject = []
			for(const element of object) {
				newObject.push(this.clone(element))
			}
			return newObject
		} else {
			let newObject = {}
			for(const property in object) {
				newObject[property] = this.clone(object[property])
			}
			return newObject
		}
	},
	copy(oldObj, newObj) {
		if(newObj === undefined) return this.clone(oldObj)
		if(oldObj === undefined) return this.clone(newObj)
		if(typeof newObj !== 'object' || typeof oldObj !== 'object') return newObj
		if(Array.isArray(newObj)) {
			if(!Array.isArray(oldObj)) {
				return this.clone(newObj)
			} else {
				let newObject = this.clone(oldObj)
				for(const element in newObj) {
					newObject[element] = this.copy(oldObj[element], newObj[element])
				}
				return newObject
			}
		} else {
			let newObject = this.clone(oldObj)
			for(const property in newObj) {
				newObject[property] = this.copy(oldObj[property], newObj[property])
			}
			return newObject
		}
	},
	paste(oldObj, newObj) {
		if(newObj === undefined) return oldObj
		if(oldObj === undefined) return newObj
		if(typeof newObj !== 'object' || typeof oldObj !== 'object') return newObj
		if(Array.isArray(newObj)) {
			if(!Array.isArray(oldObj)) {
				return newObj
			} else {
				let newObject = oldObj
				for(const element in newObj) {
					newObject[element] = this.copy(oldObj[element], newObj[element])
				}
				return newObject
			}
		} else {
			let newObject = oldObj
			for(const property in newObj) {
				newObject[property] = this.copy(oldObj[property], newObj[property])
			}
			return newObject
		}
	},

	getSafe(object, defaultVal, ...properties) {
		if(object === undefined) return defaultVal
		if(properties.length == 0) return object
		return this.getSafe(object[properties[0]], defaultVal, ...properties.slice(1))
	},
	setSafe(object, value, ...properties) {
		if(properties.length == 0) return object = value
		if(properties.length == 1) return object[properties[0]] = value
		if(object[properties[0]] === undefined) object[properties[0]] = {}
		this.setSafe(object[properties[0]], value, ...properties.slice(1))
	},


	isNumber(number) {
		return /^[0-9]+$/.test(number)
	},
	/**
	 * @returns a random integer between min and max (inclusive)
	 */
	random(min, max) {
		return Math.floor(Math.random() * (max+1-min)) + min;
	},
	/**
	 * @returns a random integer between range.min and range.max (inclusive)
	 */
	randomRange(range) {
		return this.random(range.min, range.max)
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

	sum(array, property) {
		sum = 0;
		for(let num of array.map(element => element[property])) sum += num;
		return sum;
	}

};
