const Tools = require('../tools.js')
const Data = require('../bot.js')

module.exports = {
	name: 'Configuration',
	description: 'Check and change my settings with these commands!',
	detail: 'By using the configuration command, You\'ll have access to my settings!',
	alias: ['config', 'configurate', 'botConfig', 'configBot'],
	usage: [
		['config prefix [new prefix]', 'Change my prefix, or just show the current prefix by leaving the command blank!'],
		['config perm (disable|enable) [#channel]|all', '🥺 You can change which channels I have access to... leave out `disable`/`enable` to show the perms of a channel, or just use `perm` to list all channels.'],
	],
	public: false,
	developer: false,
	guildOnly: true,
	execute(message, args) {
		if(args[0] === 'prefix') {
			prefix(message, args.slice(1))
		} else if(['perm', 'perms', 'permission', 'permissions'].includes(args[0])) {
			perm(message, args.slice(1))
		}
	},
}

/**
 * Show or set the prefix of the bot
 * @param {Discord.Message} message The message used to send the command
 * @param {string[]} args Arguments in the command
 */
function prefix(message, args) {

	if(args.length < 1) {	// Show the current prefix
		message.channel.send({embed: Data.replace({
			description: 'Current prefix: `{prefix}`' 
		})})
	} else {	// Change the prefix
		Data.setData('prefix', args[0].trim())
		message.channel.send({embed: Data.replace({ 
			description: 'Changed the prefix to `{prefix}`' 
		})})
	}

}

function perm(message, args) {

	if(args[0] === 'disable') {		// Disable a channel

		if(args[1] === 'all') {
			for(let [channelID, channel] of message.channel.guild.channels.cache) {
				if(channel.type !== 'text') continue;
				if(channelID === message.channel.id) continue;
				if(Data.getData(`disabled.${channel.id}`)) continue;
				Data.setData('disabled', channelID)
			}
			return message.channel.send({ embed: Data.replace({
				title: `🔴 All channels except #${message.channel.name} now disabled!`,
				description: `You can use \`{prefix}config perm\` to list the channels.`
			})});
		}

		channel = message.mentions.channels.first();
		if(channel === undefined) return Tools.fault(message.channel, `I can't find that channel!`)
		if(Data.getData(`disabled.${channel.id}`)) return Tools.fault(message.channel, `That channel is already disabled!`)

		Data.setData('disabled', channel.id)
		message.channel.send({ embed: Data.replace({
			title: `🔴 I've disabled that channel!`,
			description: `Now I won't be able to use <#${channel.id}> ;-; \nYou can use \`{prefix}config perm\` to list the channels.`
		})});

	} else if(args[0] === 'enable') {	// Enable a channel

		if(args[1] === 'all') {
			for(let [channelID, channel] of message.channel.guild.channels.cache) {
				if(channel.type !== 'text') continue;
				if(!Data.getData(`disabled.${channel.id}`)) continue;
				Data.setData('enabled', channelID)
			}
			return message.channel.send({ embed: Data.replace({
				title: `🟢 All channels now enabled!`,
				description: `You can use \`{prefix}config perm\` to list the channels.`
			})});
		}

		channel = message.mentions.channels.first();
		if(channel === undefined) return Tools.fault(message.channel, 'I can\'t see that channel!')
		if(!Data.getData(`disabled.${channel.id}`)) return Tools.fault(message.channel, 'That channel is already enabled!')

		Data.setData('enabled', channel.id)
		message.channel.send({ embed: Data.replace({
			title: '🟢 I\'ve enabled that channel!',
			description: `Now I can use <#${channel.id}> again ^^ \nYou can use \`{prefix}config perm\` to list the channels.`
		})});

	} else {	// List the permissions of all channels

		embed = {
			title: 'Channel Permissions',
			description: ''
		}
		for(let [channelID, channel] of message.channel.guild.channels.cache) {
			if(channel.type !== 'text') continue;
			if(!message.member.permissionsIn(channel).has('VIEW_CHANNEL')) continue;
			if(Data.getData(`disabled.${channelID}`)) {
				embed.description += `🔴 <#${channelID}>\n`;
			} else {
				embed.description += `🟢 <#${channelID}>\n`;
			}
		}
		message.channel.send({ embed: Data.replace(embed) })

	}
}
