//jshint esversion: 8

const config = require('../config.json');
const Tools = require('../tools.js');

module.exports = {
	name: 'Configuration',
	description: 'Check and change my settings with these commands!',
	detail: 'By using the configuration command, You\'ll have access to my settings!',
	alias: ['config', 'configurate', 'botConfig', 'configBot'],
	usage: [
		['config prefix [new prefix]', 'Change my prefix, or just show the current prefix by leaving the command blank!'],
		['config perm (disable|enable) [#channel]', '🥺 You can change which channels I have access to... leave out `disable`/`enable` to show the perms of a channel, or just use `perm` to list all channels.'],
		['config counting [#channel]', 'Change the counting channel!']
	],
	public: false,
	developer: false,
	guildOnly: true,
	execute(message, args) {
		if(args[0] === 'prefix') {
			prefix(message, args.slice(1));
		} else if(['perm', 'perms', 'permission', 'permissions'].includes(args[0])) {
			perm(message, args.slice(1));
		} else if(['counting', 'count'].includes(args[0])) {
			counting(message)
		}
	},
	async count(message) {
		channel = await message.client.channels.fetch(config.counting)
		messages = await channel.messages.fetch({limit: 2})
		lastMessage = messages.last()
		if(lastMessage.editedTimestamp > 0) {
			console.log(`Edited message: ${lastMessage.editedTimestamp}`)
			lastMessage.delete()
			message.delete()
			return
		}
		if(message.author.id === lastMessage.author.id &&
			message.createdTimestamp - lastMessage.createdTimestamp < 600000) {
			//console.log(`Same author: ${message.createdTimestamp - lastMessage.createdTimestamp}`)
			message.delete()
			return
		}
		number = message.content.split(/\s+/)[0]
		lastNumber = lastMessage.content.split(/\s+/)[0]
		if(!lastNumber.match(/^[0-9]+$/)) lastNumber = "0"
		if(!number.match(/^[0-9]+$/) || number - 1 != lastNumber) {
			//console.log(`Bad number: ${lastNumber} -> ${number}`)
			message.delete()
		}
	}
};

function prefix(message, args) {
	if(args.length < 1) {
		message.channel.send({embed: { description: 'Current prefix: `'+config.prefix+'`' }});
	} else {
		config.prefix = args[0].trim();
		Tools.saveJSON(config, './config.json');
		message.channel.send({embed: { description: 'Changed the prefix to `'+config.prefix+'`' }});
	}
}

function perm(message, args) {
	if(args[0] === 'disable') {
		channel = message.mentions.channels.first();
		if(!Tools.exists(channel)) { Tools.fault(message.channel, 'I can\'t find that channel!'); return; }
		index = config.disabled.indexOf(channel.id);
		if(index >= 0) Tools.fault(message.channel, 'That channel is already disabled!');
		else {
			config.disabled.push(channel.id);
			Tools.saveJSON(config, './config.json');
			message.channel.send({ embed: {
				title: '🔴 I\'ve disabled that channel!',
				description: 'Now I won\'t be able to use <#'+channel.id+'> ;-;\n'+Tools.replace('You can use `{prefix}config perm` to list the channels.')
			}});
		}
	} else if(args[0] === 'enable') {
		channel = message.mentions.channels.first();
		if(!Tools.exists(channel)) { Tools.fault(message.channel, 'I can\'t see that channel!'); return; }
		index = config.disabled.indexOf(channel.id);
		if(index < 0) Tools.fault(message.channel, 'That channel is already enabled!');
		else {
			config.disabled.splice(index, 1);
			Tools.saveJSON(config, './config.json');
			message.channel.send({ embed: {
				title: '🟢 I\'ve enabled that channel!',
				description: 'Now I can use <#'+channel.id+'> again ^^ \n'+Tools.replace('You can use `{prefix}config perm` to list the channels.')
			}});
		}
	} else {
		embed = {
			title: 'Channel Permissions',
			description: ''
		}
		for(let channel of message.channel.guild.channels.cache) {
			if(channel[1].type !== 'text') continue;
			if(!message.member.permissionsIn(channel[1]).has('VIEW_CHANNEL')) continue;
			if(config.disabled.indexOf(channel[0]) < 0) {
				embed.description += '<#'+channel[0]+'> 🟢 Enabled\n';
			} else {
				embed.description += '<#'+channel[0]+'> 🔴 Disabled\n';
			}
		}
		message.channel.send({ embed: embed })
	}
}

function counting(message) {
	if(message.mentions.channels.size < 1) {
		message.channel.send({embed: { description: `Current counting channel: <#${config.counting}>`}});
	} else {
		config.counting = message.mentions.channels.first().id;
		Tools.saveJSON(config, './config.json');
		message.channel.send({embed: { description: `Changed the counting channel to <#${config.counting}>`}});
	}
}
