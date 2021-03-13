const Discord = require('discord.js')
const fs = require('fs')
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
        channel.send({embed: Data.replaceEmbed({
			title: 'OOPS!',
			description: message
		})})
    },
	/**
	 * Send a notice when an error occurs
	 * @param {Discord.TextChannel} channel The channel to send the error to
	 * @param err The error
	 */
    error(channel, err) {
        channel.send({embed: Data.replaceEmbed({
			title: 'OOF!',
			description: `I seem to be having a problem... Don't worry, this isn't your fault.`
		})})
        console.error(err)
    },


	pageList(message, page, count = 10, list, content = {}) {
		if(page == -1 && list.length > count) {
			return message.react('⏮')
			.then(() => message.react('◀️')
			.then(() => message.react('▶️')
			.then(() => message.react('⏭')
			.then(() => pageList(message, 1, count, list, content)))))
		}
		page = Math.max(1, Math.min(Math.ceil(list.length/count), page))

		embed = this.clone(content)
		if(list.length > count) embed.footer = { text: `page ${page}/${Math.ceil(list.length/count)}` }
		embed.description = `${content.description ?? ''}
							${list.slice((page-1)*count, page*count).join('\n')}`
		message.edit('', {embed: Data.replaceEmbed(embed)})
		if(list.length <= count) return

		message.awaitReactions((reaction, user) => {
			if(user.id === message.client.user.id) return false
			reaction.users.remove(user)
			return ['⏮', '◀️', '▶️', '⏭'].includes(reaction.emoji.name)
		}, { max: 1, time: 20000, errors: ['time'] }).then(reactions => {
			switch(reactions.first().emoji.name) {
				case '⏮': this.pageList(message, 1, count, list, content)
				case '⏭': this.pageList(message, list.length, count, list, content)
				case '◀️': this.pageList(message, page-1, count, list, content)
				case '▶️': this.pageList(message, page+1, count, list, content)
			}
		}).catch(() => message.reactions.removeAll())
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
			ctx.fillText(color, width/2, height/2, width*0.9)
		} else {
			ctx.fillStyle = '#000000'
			ctx.fillRect(0, 0, width, height)
			ctx.fillStyle = '#ffffff'
			ctx.fillText('COLOR NOT SET', width/2, height/2, width*0.9)
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


	async findMember(message, arg) {
		if(message.mentions.members.size > 0) return message.mentions.members.first()
		if(message.channel.type !== 'text') return
		members = await message.guild.members.fetch({ query: arg, limit: 1 })
		if(members.first() !== undefined) return members.first()
	},
	async getInvites(guild) {
		let invites = {}
		let inv = await guild.fetchInvites()
	  	inv.forEach(invite => {
			if(invites[invite.inviter.id] === undefined) invites[invite.inviter.id] = 0
			invites[invite.inviter.id] += invite.uses
		})
		return invites
	},
	async getInviteLinks(member) {
		let invites = []
		if(member.guild) {
			let inv = await member.guild.fetchInvites()
			inv.forEach(invite => {
				if(invite.inviter.id !== member.id) return
				invites.push({
					code: invite.code,
					uses: invite.uses,
					max: invite.maxUses,
					expire: invite.expiresTimestamp
				})
			})
		} else {
			client.guilds.cache.forEach(async guild => {
				let inv = await guild.fetchInvites()
				inv.forEach(invite => {
					if(invite.inviter.id !== member.id) return
					invites.push({
						code: invite.code,
						uses: invite.uses,
						max: invite.maxUses,
						expire: invite.expiresTimestamp
					})
				})
			});
		}
		return invites
	},
	getAuthor(message) {
		return message.member ?? message.author
	},
	getName(member) {
		return member.displayName ?? member.username
	},
	getAvatar(member, size = 256) {
		return (member.user ?? member).displayAvatarURL({ dynamic: true, size: size })
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
	/**
	 * Copy object into old object but keep existing properties
	 */
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
	/**
	 * Similar to copy() but doesn't make clones
	 */
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
					newObject[element] = this.paste(oldObj[element], newObj[element])
				}
				return newObject
			}
		} else {
			let newObject = oldObj
			for(const property in newObj) {
				newObject[property] = this.paste(oldObj[property], newObj[property])
			}
			return newObject
		}
	},
	mapObject(object, fn) {
		return Object.keys(object).reduce(function(result, key) {
			result[key] = fn(object[key])
			return result
		}, {})
	},

	getSafe(object, defaultVal, ...properties) {
		if(object === undefined) return defaultVal
		if(properties.length == 0) return this.copy(defaultVal, object)
		return this.getSafe(object[properties[0]], defaultVal, ...properties.slice(1))
	},
	setSafe(object, value, ...properties) {
		if(properties.length == 0) return object = value
		if(object === undefined) object = {}
		if(properties.length == 1) return object[properties[0]] = value
		if(object[properties[0]] === undefined) object[properties[0]] = {}
		this.setSafe(object[properties[0]], value, ...properties.slice(1))
	},

	removeElements(array, ...elements) {
		let arr = this.clone(array)
		for(let i = arr.length-1; i >= 0; i--) {
			if(elements.includes(arr[i])) {
				arr.splice(i, 1)
			}
		}
		return arr
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

	setDay(date, weekday = 1) {
		let day = date.getDay()
		if(day < weekday) day += 7
		date.setHours(-24 * (day - weekday))
	},
	durationToStr(duration, start = -1, end = -1) { // 0: second, 1: minute, 2: hour, 3: day
		if(start == -1 || end == -1) {
			if(this.getDay(duration, true) > 0) {
				start = 2; end = 3
			} else if(this.getHour(duration, true) > 0) {
				start = 1; end = 2
			} else if(this.getMinute(duration, true) > 0) {
				start = 0; end = 1
			} else {
				start = 0; end = 0
			}
		}
		let str = ''
		if(end == 0) return `${this.getSecond(duration, true)}s`
		if(start == 0) str = ` ${this.getSecond(duration, false)}s`
		if(end == 1) return `${this.getMinute(duration, true)}m${str}`
		if(start <= 1) str = ` ${this.getMinute(duration, false)}m${str}`
		if(end == 2) return `${this.getHour(duration, true)}h${str}`
		if(start <= 2) str = ` ${this.getHour(duration, false)}h${str}`
		if(end == 3) return `${this.getDay(duration)}d${str}`
	},
	getDay(duration) {
		return Math.floor(duration / 86400000)
	},
	getHour(duration, end = true) {
		if(end) return Math.floor(duration / 3600000)
		return Math.floor((duration / 3600000) % 24)
	},
	getMinute(duration, end = false) {
		if(end) return Math.floor(duration / 60000)
		return Math.floor((duration / 60000) % 60)
	},
	getSecond(duration, end = false) {
		if(end) return Math.floor(duration / 1000)
		return Math.floor((duration / 1000) % 60)
	},

	normalizeSpacing(str, length, alignment = 'center') {
		const leftover = Math.max(0, length - str.length)
		if(alignment  === 'left') {
			return str + Array(leftover).fill(' ').join('')
		} else if(alignment  === 'right') {
			return Array(leftover).fill(' ').join('') + str 
		} else {
			return Array(Math.floor(leftover/2)).fill(' ').join('') + str + Array(Math.ceil(leftover/2)).fill(' ').join('')
		}
	},

	/**
	 * Adds a postfix to a number (1st, 2nd, 3rd...)
	 * @param {int} num The number to add a postfix to
	 * @returns a string with the postfix
	 */
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
	}

};
