
/*
		  ██████  ██ ███    ██  ██████  ██████   ██████  ████████ 
		  ██   ██ ██ ████   ██ ██    ██ ██   ██ ██    ██    ██    
		  ██   ██ ██ ██ ██  ██ ██    ██ ██████  ██    ██    ██    
		  ██   ██ ██ ██  ██ ██ ██    ██ ██   ██ ██    ██    ██    
		  ██████  ██ ██   ████  ██████  ██████   ██████     ██    
*/

const Discord = require('discord.js')
const Data = require('./data')
const Commands = require('./commands')

// Start Discord client
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] })
client.login(Data.get('token'))


// When the bot starts...
client.once('ready', () => {
	client.user.setActivity(Data.get('status'), Data.get('statusMode'))
	console.log(`DinoBot logged in as @${client.user.tag} at ${Date()}`)
});


// When a message is sent...
client.on('message', message => {

	// Initial checks
	if(message.author.id === client.user.id) return
	if(Data.get(`disabled.${message.channel.id}`)) return
	message.content = message.content.trim()

	Commands.call('level', message)

	// Check if it's a command or not
	if(message.content.startsWith(Data.get('prefix'))) {
		args = message.content.slice(Data.get('prefix').length).trim().split(/\s+/)
	} else if(message.content.startsWith('<@!'+client.user.id+'>')) {
		args = message.content.slice(client.user.id.length+4).trim().split(/\s+/)
	} else {
		if(message.channel.type === 'text') {
			if(Data.get(`counting.${message.channel.id}`)) Commands.call('count', message)
			else Commands.call('react', message)
		} return
	}

	if(message.author.bot) return
	if(message.author.id === Data.get('developer') && Commands.dev(message, args)) return
	Commands.execute(message, args)
});