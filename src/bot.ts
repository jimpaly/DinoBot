
/*
		  ██████   ██  ███    ██   ██████   ██████    ██████   ████████ 
		  ██   ██  ██  ████   ██  ██    ██  ██   ██  ██    ██     ██    
		  ██   ██  ██  ██ ██  ██  ██    ██  ██████   ██    ██     ██    
		  ██   ██  ██  ██  ██ ██  ██    ██  ██   ██  ██    ██     ██    
		  ██████   ██  ██   ████   ██████   ██████    ██████      ██    
*/

import { oneLine } from 'common-tags'
import * as readLine from 'readline'
import { Config, Fun, Profiles, Stats } from './database'
import * as Mongoose from 'mongoose'
import { join } from 'path'
import { CommandoClient } from 'discord.js-commando'
import { Collection, VoiceChannel } from 'discord.js'
import { Discord, Obj } from './tools'

(async function() {

	process.stdout.write(`${new Date().toLocaleString('en-US')}`)

	readLine.cursorTo(process.stdout, 30)
	process.stdout.write(`Loading private.json...`)
	const privates = await Obj.readJSON('../private.json') as {
		token: string
		developer: string
		guild: string
		database: string
	}
	readLine.cursorTo(process.stdout, 30)
	process.stdout.write(`Loading config.json... `)
	await Config.read()
	readLine.cursorTo(process.stdout, 30)
	process.stdout.write(`Loading fun.json...    `)
	await Fun.readConfig()
	readLine.cursorTo(process.stdout, 30)
	process.stdout.write(`Loading stats.json...  `)
	await Stats.readConfig()
	readLine.cursorTo(process.stdout, 30)
	process.stdout.write(`Loaded config files    `)

	readLine.cursorTo(process.stdout, 55)
	const database = privates.database.replace(/:([^\/]+?)@/, ':******@')
	process.stdout.write(`Connecting to MongoDB at ${database}...`)
	Mongoose.connect(privates.database, {useNewUrlParser: true, useUnifiedTopology: true})
	Mongoose.connection.on('error', console.error.bind(console, 'Error connecting to MongoDB: '))
	Mongoose.connection.once('open', () => {
		readLine.cursorTo(process.stdout, 55)
		process.stdout.write(`Connected to MongoDB`+' '.repeat(database.length+9))
	})

	const client = new CommandoClient({
		commandPrefix: Config.getPrefix(),
		owner: privates.developer,
		ws: { intents: [
			'GUILDS', 
			'GUILD_MESSAGES', 'DIRECT_MESSAGES', 
			'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_REACTIONS', 
			'GUILD_VOICE_STATES', 
			'GUILD_MEMBERS'
		]},
		partials: ['MESSAGE', 'GUILD_MEMBER']
	})
	client.registry
		.registerGroups([
			['dev', 'Dev'],
			['profile', 'Profile'],
			['stats', 'Leveling'],
			['fun', 'Fun'],
			['utility', 'Utility'],
		])
		.registerDefaultTypes()
		.registerCommandsIn(join(__dirname, 'commands'))
	client.dispatcher.addInhibitor(message => {
		if(!Config.isChannelEnabled(message.channel.id))
			return `channel(<#${message.channel.id}>) disabled`
		return false
	})
	client.dispatcher.addInhibitor(message => {
		if(message.guild.id !== Discord.guild.id) return 'wrong guild'
		return false
	})
	client.dispatcher.addInhibitor(message => {
		if(message.channel.id === Fun.getCountingChannel()) return 'counting channel'
		return false
	})
	readLine.cursorTo(process.stdout, 80)
	process.stdout.write(`Logging into Discord`)
	client.login(privates.token)

	let invitesCache = new Collection<string, number>()
	// When the bot starts...
	client.once('ready', () => {
		client.user?.setActivity(Config.getStatus())
		Discord.guild = client.guilds.cache.get(privates.guild) ?? Discord.guild
		Discord.getInvites().then(invites => invitesCache = invites)
		readLine.cursorTo(process.stdout, 80)
		process.stdout.write(`Logged in as @${client.user?.tag}\n`)
	});

	// When a message is sent...
	client.on('message', async message => {
		// Initial checks
		if(!message.guild || message.guild.id !== privates.guild) return
		if(!Config.isChannelEnabled(message.channel.id)) return
		if(message.type !== 'DEFAULT') return
		if(message.webhookID !== null) return
		message.content = message.content.trim()

		Discord.guild = message.guild

		if(message.member) {

			let user = await Stats.get(message.member.id)
			user.addMessage()
			if((message.member.voice.channel === null || message.member.voice.deaf)
			&& user.voice.inVoice) user.updateVoice(false)
			Stats.handleBump(message)

			if(message.channel.id === Fun.getCountingChannel()) {
				user.addCount()
				Fun.handleCount(message)
			}
			Fun.react(message)

			let profile = await Profiles.get(message.member.id)
			if(profile.joins.length == 0) profile.addInviter() 
		}
	});
	client.on('error', console.error);

	client.on('messageDelete', async message => {
		if(!message.guild || message.guild.id !== privates.guild) return
		if(message.member && message.channel.id === Fun.getCountingChannel()) {
			let user = await Stats.get(message.member.id)
			user.removeCount()
		}
	})
	client.on('messageDeleteBulk', messages => {
		messages.forEach(async message => {
			if(!message.guild || message.guild.id !== privates.guild) return
			if(message.member && message.channel.id === Fun.getCountingChannel()) {
				let user = await Stats.get(message.member.id)
				user.removeCount()
			}
		})
	})

	client.on('voiceStateUpdate', (oldState, newState) => {
		if(!oldState.guild || oldState.guild.id !== privates.guild) return
		if(!newState.guild || newState.guild.id !== privates.guild) return

		function getJoinedCount(channel: VoiceChannel) {
			return channel.members.filter(member => !member.user.bot 
				&& member.voice.channel !== null && !member.voice.deaf).size
		}
		function voiceJoin(channel: VoiceChannel) {
			if(getJoinedCount(channel) > 1)
				Stats.getMany(channel.members.keyArray(), user => 
					user.updateVoice(true))
		}
		function voiceLeave(channel: VoiceChannel, user: Discord.User | null) {
			if(getJoinedCount(channel) <= 1)
				Stats.getMany(channel.members.keyArray(), user =>
					user.updateVoice(false))
			if(user) Stats.get(user.id).then(user => 
				user.updateVoice(false))
		}

		if(newState.channel !== null && oldState.channel === null) { // Joining channel
			voiceJoin(newState.channel)
		} else if(newState.channel === null && oldState.channel !== null) { // Leaving channel
			voiceLeave(oldState.channel, oldState.member)
		} else if(newState.channel !== null && oldState.channel !== null) {
			if(newState.channel.id !== oldState.channel.id) {   // Switching channels
				voiceJoin(newState.channel)
				voiceLeave(oldState.channel, oldState.member)
			} else if(!newState.deaf && oldState.deaf) {    // Undeafening
				voiceJoin(newState.channel)
			} else if(newState.deaf && !oldState.deaf) {    // Deafening
				voiceLeave(oldState.channel, oldState.member)
			}
		}
	})

	client.on('inviteCreate', () => {
		Discord.getInvites().then(invites => invitesCache = invites)
	})
	client.on('guildMemberAdd', async member => {
		if(member.guild.id !== privates.guild) return

		const newInvites = await Discord.getInvites()
		const inviter = newInvites.findKey((count, id) => count > (invitesCache.get(id)??0 ))
		invitesCache = newInvites

		let profile = await Profiles.get(member.id)
		profile.addInviter(inviter)
		if(profile.joins.find(join => join.inviter === inviter) && inviter) Stats.log(oneLine`
			<@!${inviter}> just got {stats.invites.join} points 
			for inviting <@!${member.id}>!
		`, [member.id], [inviter])
		Stats.getMany(profile.joins.map(join => join.inviter ?? ''), user => {
			user.addInvite(member.id)
		})
	})
	client.on('guildMemberRemove', async member => {
		if(member.guild.id !== privates.guild) return

		let profile = await Profiles.get(member.id)
		Stats.getMany(profile.joins.map(join => join.inviter ?? ''), user => {
			user.removeInvite(member.id)
		})
	})

}())