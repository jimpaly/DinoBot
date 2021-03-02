//jshint esversion: 8

const Discord = require('discord.js');
const fs = require('fs');
const config = require('./config.json');
const Tools = require('./tools.js');

const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION'] });
client.login(config.token);

client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log('Ready');
});

client.on('message', message => {
	//if(message.author.bot) return;
	if(message.author.id === client.user.id) return;
	if(config.disabled.includes(message.channel.id)) return;

	message.content = message.content.trim();


	if(message.channel.id === config.counting) {
		client.commands.get('Configuration').count(message)
		return
	}

	if(message.channel.type === 'text') {
		client.commands.get('Counting').count(message);

		client.commands.get('AFK').remove(message.channel, message.author);
	}

	if(message.content.startsWith(config.prefix)) {
		args = message.content.slice(config.prefix.length).trim().split(/\s+/);
	} else if(message.content.startsWith('<@!'+config.id+'>')) {
		args = message.content.slice(config.id.length+4).trim().split(/\s+/);
	} else return client.commands.get('Text').react(message);

	for(const [name, command] of client.commands) {
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
});

client.on('messageReactionAdd', async (reaction, user) => {
	if(user.bot) return;
	if(config.disabled.includes(reaction.message.channel.id)) return;
	if(reaction.message.channel.type === 'text') client.commands.get('AFK').remove(reaction.message.channel, user);
});
client.on('messageReactionRemove', async (reaction, user) => {
	if(config.disabled.includes(reaction.message.channel.id)) return;
	if(user.bot) return;
});
