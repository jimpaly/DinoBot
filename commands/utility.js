const Tools = require('../tools.js')
const Data = require('../bot.js')

module.exports = {
	name: 'Utility',
	description: 'Check some of my info and change my settings!',
	commands: [
		{
			name: 'Help',
			alias: ['help', 'h', 'command', 'commands'],
			description: `
			The help menus tell you how to use specific commands! Here are some tips on the formatting I use:
			- An **angle bracket** (\`<>\`) means you are *required* to provide something in place as described.
			- A **square bracket** (\`[]\`) means the replacement is *optional* and you may just delete the thing entirely.
			- Parentheses, like \`()\`, are different from brackets. Write the keword inside exactly as shown, but the keyword is now optional!
			- I also have the vertical bar (\`|\`) which means "or", so you can use any one of the given keywords.`,
			usage: [
				['help', `List all the command categories!`],
				['help <command>', `Show information about a command!`],
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {

				const command = getCommand(args[0])

				if(command !== undefined) {	// If command exists, show information
					message.channel.send({embed: Data.replace({
						title: command.name,
						description: command.description,
						fields: [
							{ 
								name: 'Usage', 
								value: `${command.name === 'Help' ? '' : '*(Try `{prefix}help help` to learn about what `<>` and `[]` mean!)*'}
										${command.usage.map((usage) => `> \`{prefix}${usage[0]}\` ${usage[1]}`).join('\n')}` 
							}, { 
								name: 'Alias', 
								value: `\`${command.alias.join('`, `')}\`` 
							}, { 
								name: 'Info', 
								value: `Public: ${command.public ? 'Yes' : 'No'}
										Server only: ${command.guildOnly ? 'Yes' : 'No'}`
							}
						]
					})})
				} else {	// If no command was mentioned, list all commands
					message.channel.send({embed: Data.replace({
						title: 'Command Categories',
						description: `\`{prefix}help <command>\` to show how to use a specific command.`,
						fields: Object.values(Data.getAllCommands()).map((category) => { return {
							name: category.name,
							value: `\`${category.commands.map((command) => command.alias[0]).join('` `')}\``
						}})
					})})
				}
		
			}
		}, {
			name: 'Prefix',
			alias: ['prefix', 'setPrefix', 'botPrefix', 'configPrefix'],
			description: `Change the prefix you use to summon me!`,
			usage: [
				['prefix', 'Show the current prefix'],
				['prefix <new prefix>', 'Change my prefix to something new! (Admin only)']
			],
			public: true,
			developer: false,
			guildOnly: true,
			execute(message, args) {

				if(args.length > 0 && Data.isAdmin(message.member)) {
					Data.setData('prefix', args[0].trim())
					message.channel.send({embed: Data.replace({ description: 'Changed the prefix to `{prefix}`' })})
				} else {
					message.channel.send({embed: Data.replace({ description: 'Current prefix: `{prefix}`' })})
				}
			},
		}, {
			name: 'Channel Perms',
			alias: ['perm', 'perms', 'permission', 'permissions'],
			description: `🥺 You can change which channels I have access to...`,
			usage: [
				['perm', 'List all channel permissions'],
				['perm enable|disable <#channel>', 'Enable or disable my access to a channel'],
				['perm enable|disable all', 'Enable or disable my access to all channels']
			],
			public: false,
			developer: false,
			guildOnly: true,
			execute(message, args) {

				if(args[0] === 'disable') {		// Disable a channel
					if(args[1] === 'all') {
						for(let [channel, foo] of message.channel.guild.channels.cache) {
							if(channelID !== message.channel.id) setPerm(channel, false)
						}
						message.channel.send({ embed: Data.replace({
							title: `🔴 All channels except #${message.channel.name} now disabled!`,
							description: `You can use \`{prefix}config perm\` to list the channels.`
						})})
					} else {
						setPerm(message.mentions.channels.first(), false, message.channel)
					}
				} else if(args[0] === 'enable') {	// Enable a channel
					if(args[1] === 'all') {
						for(let [channel, foo] of message.channel.guild.channels.cache) {
							setPerm(channel, true)
						}
						message.channel.send({ embed: Data.replace({
							title: `🟢 All channels now enabled!`,
							description: `You can use \`{prefix}config perm\` to list the channels.`
						})})
					} else {
						setPerm(message.mentions.channels.first(), true, message.channel)
					}
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
			},
		}
	]
}

/**
 * Get the info of a command
 * @param {string} alias The alias used for the command
 * @returns The command info (nothing if can't find)
 */
function getCommand(alias) {

	if(alias === undefined) return

	const commands = Data.getAllCommands()

	for(const category in commands) {
		for(const command of commands[category].commands) {
			if(command.alias.includes(alias.toLowerCase())) return command
		}
	}
}


/**
 * Set the permissions of a channel
 * @param {string} channel The ID of the channel to set
 * @param {boolean} enabled Whether to set it enabled or not
 * @param {Discord.TextChannel} msgChannel Channel to send fault messages to
 */
function setPerm(channel, enabled, msgChannel) {
	
	if(channel === undefined) return Tools.fault(msgChannel, `I can't find that channel!`)
	if(disabled && Data.getData(`disabled.${channel}`)) return Tools.fault(msgChannel, `That channel is already disabled!`)
	if(enabled && !Data.getData(`disabled.${channel}`)) return Tools.fault(msgChannel, 'That channel is already enabled!')

	Data.setData(enabled ? 'enabled' : 'disabled', channel)
	if(msgChannel !== undefined) msgChannel.send({ embed: Data.replace({
		title: enabled ? '🟢 I\'ve enabled that channel!' : `🔴 I've disabled that channel!`,
		description: `Now I won't be able to use <#${channel}> ;-; \nYou can use \`{prefix}config perm\` to list the channels.`
	})});
}
