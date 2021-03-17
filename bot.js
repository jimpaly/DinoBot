
/*
		  ██████  ██ ███    ██  ██████  ██████   ██████  ████████ 
		  ██   ██ ██ ████   ██ ██    ██ ██   ██ ██    ██    ██    
		  ██   ██ ██ ██ ██  ██ ██    ██ ██████  ██    ██    ██    
		  ██   ██ ██ ██  ██ ██ ██    ██ ██   ██ ██    ██    ██    
		  ██████  ██ ██   ████  ██████  ██████   ██████     ██    
*/

// Start Discord client
const Discord = require('discord.js')
const intents = ['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES', 'GUILD_INVITES', 'GUILD_MEMBERS']
const partials = ['MESSAGE', 'GUILD_MEMBER'] 
const client = new Discord.Client({ ws: { intents: intents }, partials: partials })
module.exports.client = client

const Data = require('./data')
const Commands = require('./commands')
const Tools = require('./tools')
const invitesCache = {}

client.login(Data.get('token'))

// When the bot starts...
client.on('ready', () => {
	client.user.setActivity(Data.get('status'), Data.get('statusMode'))
	client.guilds.cache.forEach(guild => {
		Tools.getInvites(guild).then(invites => invitesCache[guild.id] = invites)
	});
	console.log(`DinoBot logged in as @${client.user.tag} at ${Date()}`)
});


// When a message is sent...
client.on('message', async message => {

	// Initial checks
	if(message.type !== 'DEFAULT') return
	if(message.webhookID !== null) return
	if(Data.get(`disabled.${message.channel.id}`)) return
	message.content = message.content.trim()

	if(message.channel.type === 'text' && Data.get(`member.${message.member.id}.joinDate`) == 0) {
        Data.set(`member.${message.member.id}.join`)
	}

	console.log(message.content)

	if(message.channel.type === 'text') {
		Commands.call('level', message)
		if(Data.get(`counting.${message.channel.id}`)) return Commands.call('count', message)
		Commands.call('react', message)
	} 

	if(message.author.id === client.user.id) return

	// Check if it's a command or not
	if(message.content.startsWith(Data.get('prefix'))) {
		args = message.content.slice(Data.get('prefix').length).trim().split(/\s+/)
	} else if(message.content.startsWith('<@!'+client.user.id+'>')) {
		args = message.content.slice(client.user.id.length+4).trim().split(/\s+/)
	} else return

	if(message.author.bot) return
	if(message.author.id === Data.get('developer') && Commands.dev(message, args)) return
	Commands.execute(message, args)
});

client.on('messageDelete', message => {
	if(Data.get(`counting.${message.channel.id}`)) Commands.call('uncount', message)
})
client.on('messageDeleteBulk', messages => {
	for(const message of messages.array()) {
		if(Data.get(`counting.${message.channel.id}`)) Commands.call('uncount', message)
	}
})

client.on('voiceStateUpdate', (oldState, newState) => {
	Commands.call('voice', [oldState, newState])
})

client.on('inviteCreate', (invite) => {
	Tools.getInvites(invite.guild).then(invites => invitesCache[invite.guild.id] = invites)
})

client.on('guildMemberAdd', async (member) => {
	const newInvites = await Tools.getInvites(member.guild)
	for(const inviter in newInvites) {
		if(newInvites[inviter] > invitesCache[member.guild.id][inviter]) {
			Commands.call('memberAdd', [member, inviter])
			return invitesCache[member.guild.id] = newInvites
		}
	}
	Commands.call('memberAdd', [member])
})
client.on('guildMemberRemove', (member) => {
	Commands.call('memberRemove', member)
})