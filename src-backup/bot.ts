
/*
		  ██████   ██  ███    ██   ██████   ██████    ██████   ████████ 
		  ██   ██  ██  ████   ██  ██    ██  ██   ██  ██    ██     ██    
		  ██   ██  ██  ██ ██  ██  ██    ██  ██████   ██    ██     ██    
		  ██   ██  ██  ██  ██ ██  ██    ██  ██   ██  ██    ██     ██    
		  ██████   ██  ██   ████   ██████   ██████    ██████      ██    
*/

import { oneLine } from 'common-tags'
import * as readLine from 'readline'
// import { Config, Fun, Profiles, Stats } from './database'
import * as Mongoose from 'mongoose'
import { join } from 'path'
import { CommandStore, SapphireClient } from '@sapphire/framework';
import { Client, Collection, Intents, VoiceChannel } from 'discord.js'
import { Discord, Obj } from './tools'

import { BotClient } from './tools/command'

require('dotenv').config()

(async function() {

	process.stdout.write(`${new Date().toLocaleString('en-US')}`)

	// Load config files
	readLine.cursorTo(process.stdout, 40)
	// readLine.cursorTo(process.stdout, 40)
	// process.stdout.write(`Loading config.json... `)
	// await Config.read()
	// readLine.cursorTo(process.stdout, 40)
	// process.stdout.write(`Loading fun.json...    `)
	// await Fun.readConfig()
	// readLine.cursorTo(process.stdout, 40)
	// process.stdout.write(`Loading stats.json...  `)
	// await Stats.readConfig()
	// readLine.cursorTo(process.stdout, 40)
	// process.stdout.write(`Loaded config files    `)

	// Connect to MongoDB with mongoose
	// readLine.cursorTo(process.stdout, 65)
	// const database = privates.database.replace(/:([^\/]+?)@/, ':******@')
	// process.stdout.write(`Connecting to MongoDB at ${database}...`)
	// Mongoose.connect(privates.database, {useNewUrlParser: true, useUnifiedTopology: true})
	// Mongoose.connection.on('error', console.error.bind(console, 'Error connecting to MongoDB: '))
	// Mongoose.connection.once('open', () => {
	// 	readLine.cursorTo(process.stdout, 65)
	// 	process.stdout.write(`Connected to MongoDB`+' '.repeat(database.length+9))
	// })

	// Create Discord client
	const client = new BotClient({ 
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_MEMBERS,
		],
		partials: ['MESSAGE', 'GUILD_MEMBER'],
	});

	client.loadCommands([
		{
			name: 'Dev',
			directory: 'dev',
			description: 'Development commands'
		}
	])

	{
	// const client = new CommandoClient({
	// 	commandPrefix: Config.getPrefix(),
	// 	owner: privates.developer,
	// 	ws: { intents: [
	// 		'GUILDS', 
	// 		'GUILD_MESSAGES', 'DIRECT_MESSAGES', 
	// 		'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_REACTIONS', 
	// 		'GUILD_VOICE_STATES', 
	// 		'GUILD_MEMBERS'
	// 	]},
	// 	partials: ['MESSAGE', 'GUILD_MEMBER']
	// })
	// client.registry
	// 	.registerGroups([
	// 		['dev', 'Dev'],
	// 		['profile', 'Profile'],
	// 		['stats', 'Leveling'],
	// 		['fun', 'Fun'],
	// 		['utility', 'Utility'],
	// 	])
	// 	.registerDefaultTypes()
	// 	.registerCommandsIn(join(__dirname, 'commands'))
	// client.dispatcher.addInhibitor(message => {
	// 	if(!Config.isChannelEnabled(message.channel.id))
	// 		return `channel(<#${message.channel.id}>) disabled`
	// 	return false
	// })
	// client.dispatcher.addInhibitor(message => {
	// 	if(message.guild.id !== Discord.guild.id) return 'wrong guild'
	// 	return false
	// })
	// client.dispatcher.addInhibitor(message => {
	// 	if(message.channel.id === Fun.getCountingChannel()) return 'counting channel'
	// 	return false
	// })
	}
	readLine.cursorTo(process.stdout, 90)
	process.stdout.write(`Logging into Discord`)
	client.login(process.env.BOT_TOKEN)

	let invitesCache = new Collection<string, number>()
	// When the bot starts...
	client.once('ready', () => {
		// client.user?.setActivity(Config.getStatus())
		Discord.guild = client.guilds.cache.get(process.env.GUILD ?? '') ?? Discord.guild
		Discord.getInvites().then(invites => invitesCache = invites)
		readLine.cursorTo(process.stdout, 90)
		process.stdout.write(`Logged in as @${client.user?.tag}\n`)
	});

	// client.on('interactionCreate', (interaction) => {
	// 	if (interaction.isCommand()) {

	// 	}
	// })

	// // When a message is sent...
	// client.on('messageCreate', async message => {
	// 	// Initial checks
	// 	if(!message.guild || message.guild.id !== privates.guild) return
	// 	if(!Config.isChannelEnabled(message.channel.id)) return
	// 	if(message.type !== 'DEFAULT') return
	// 	if(message.webhookId !== null) return
	// 	message.content = message.content.trim()

	// 	// Update cached guild
	// 	Discord.guild = message.guild

	// 	if(message.member) {
	// 		// Increment stats
	// 		let user = await Stats.get(message.member.id)
	// 		user.addMessage()
	// 		if((message.member.voice.channel === null || message.member.voice.deaf)
	// 		&& user.voice.inVoice) user.updateVoice(false)
	// 		Stats.handleBump(message)
	// 		if(message.channel.id === Fun.getCountingChannel()) {
	// 			user.addCount()
	// 			Fun.handleCount(message)
	// 		}
	// 		// text reactions (owo and stuff)
	// 		Fun.react(message)

	// 		// If it's their first message, create a profile
	// 		let profile = await Profiles.get(message.member.id)
	// 		if(profile.joins.length == 0) profile.addInviter() 
	// 		if(profile.joins.length == 1 && message.member.joinedAt) 
	// 			profile.joins[0].date = message.member.joinedAt
	// 	}
	// });

	// // When there's an error? Honestly I don't know what errors this handles
	// client.on('error', console.error);

	// // When messages are deleted, remove the members' count
	// client.on('messageDelete', async message => {
	// 	if(!message.guild || message.guild.id !== privates.guild) return
	// 	if(message.member && message.channel.id === Fun.getCountingChannel()) {
	// 		let user = await Stats.get(message.member.id)
	// 		user.removeCount()
	// 	}
	// })
	// client.on('messageDeleteBulk', messages => {
	// 	messages.forEach(async message => {
	// 		if(!message.guild || message.guild.id !== privates.guild) return
	// 		if(message.member && message.channel.id === Fun.getCountingChannel()) {
	// 			let user = await Stats.get(message.member.id)
	// 			user.removeCount()
	// 		}
	// 	})
	// })

	// TODO: need to redo this with new discord voice api
	// When voice states change, update voice stats
	// client.on('voiceStateUpdate', (oldState, newState) => {
	// 	if(!oldState.guild || oldState.guild.id !== privates.guild) return
	// 	if(!newState.guild || newState.guild.id !== privates.guild) return

	// 	/** @returns the number of real people in the voice channel */
	// 	function getJoinedCount(channel: VoiceChannel) {
	// 		return channel.members.filter(member => !member.user.bot 
	// 			&& member.voice.channel !== null && !member.voice.deaf).size
	// 	}
	// 	// TODO: don't count deaf members
	// 	/** Toggles on the voice status of members in the channel */
	// 	function voiceJoin(channel: VoiceChannel) {
	// 		if(getJoinedCount(channel) > 1)
	// 			Stats.getMany(channel.members.keyArray(), user => 
	// 				user.updateVoice(true))
	// 	}
	// 	/** Toggles off the voice status of members in the channel */
	// 	function voiceLeave(channel: VoiceChannel, user: Discord.User | null) {
	// 		if(getJoinedCount(channel) <= 1)
	// 			Stats.getMany(channel.members.keyArray(), user =>
	// 				user.updateVoice(false))
	// 		if(user) Stats.get(user.id).then(user => 
	// 			user.updateVoice(false))
	// 	}

	// 	if(newState.channel !== null && oldState.channel === null) { // Joining channel
	// 		voiceJoin(newState.channel)
	// 	} else if(newState.channel === null && oldState.channel !== null) { // Leaving channel
	// 		voiceLeave(oldState.channel, oldState.member)
	// 	} else if(newState.channel !== null && oldState.channel !== null) {
	// 		if(newState.channel.id !== oldState.channel.id) {   // Switching channels
	// 			voiceJoin(newState.channel)
	// 			voiceLeave(oldState.channel, oldState.member)
	// 		} else if(!newState.deaf && oldState.deaf) {    // Undeafening
	// 			voiceJoin(newState.channel)
	// 		} else if(newState.deaf && !oldState.deaf) {    // Deafening
	// 			voiceLeave(oldState.channel, oldState.member)
	// 		}
	// 	}
	// })

// 	// Update the invites cache (used for tracking inviters)
// 	client.on('inviteCreate', () => {
// 		Discord.getInvites().then(invites => invitesCache = invites)
// 	})

// 	// When a member joins, create their profile and update invite stats for the inviter
// 	client.on('guildMemberAdd', async member => {
// 		if(member.guild.id !== privates.guild) return

// 		// Find the inviter
// 		const newInvites = await Discord.getInvites()
// 		const inviter = newInvites.findKey((count, id) => count > (invitesCache.get(id)??0 ))
// 		invitesCache = newInvites

// 		// Get member's profile or create a new profile, then add the inviter
// 		let profile = await Profiles.get(member.id)
// 		profile.addInviter(inviter)

// 		// Send the inviter reward message to logging channel
// 		if(profile.joins.find(join => join.inviter === inviter) && inviter) Stats.log(oneLine`
// 			<@!${inviter}> just got {stats.invites.join} points 
// 			for inviting <@!${member.id}>!
// 		`, [member.id], [inviter])

// 		// Add the invite to all previous inviters of the member
// 		Stats.getMany(profile.joins.map(join => join.inviter ?? ''), user => {
// 			user.addInvite(member.id)
// 		})
// 	})
// 	// When a member leaves, remove them from all inviters' stats
// 	client.on('guildMemberRemove', async member => {
// 		if(member.guild.id !== privates.guild) return

// 		// Get inviters and remove the invite from them
// 		let profile = await Profiles.get(member.id)
// 		Stats.getMany(profile.joins.map(join => join.inviter ?? ''), user => {
// 			user.removeInvite(member.id)
// 		})
// 	})

// }())