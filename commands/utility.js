const Tools = require('../tools')
const Data = require('../data')
const Commands = require('../commands')

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

				const command = Commands.getCommand(args[0])

				if(command !== undefined) {	// If command exists, show information
					message.channel.send({embed: Data.replaceEmbed({
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
					message.channel.send({embed: Data.replaceEmbed({
						title: 'All Commands',
						description: `\`{prefix}help <command>\` to show how to use a specific command.`,
						fields: Object.entries(Commands.getCommands()).map((command) => { return {
							name: command[0], value: `\`${command[1].join('` `')}\``}})
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
					Data.set('prefix', args[0].trim())
					message.channel.send({embed: Data.replaceEmbed({ description: 'Changed the prefix to `{prefix}`' })})
				} else {
					message.channel.send({embed: Data.replaceEmbed({ description: 'Current prefix: `{prefix}`' })})
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
							if(channel !== message.channel.id) setPerm(channel, false)
						}
						message.channel.send({ embed: Data.replaceEmbed({
							title: `🔴 All channels except #${message.channel.name} now disabled!`,
							description: `You can use \`{prefix}perm\` to list the channels.`
						})})
					} else {
						setPerm(message.mentions.channels.first().id, false, message.channel)
					}
				} else if(args[0] === 'enable') {	// Enable a channel
					if(args[1] === 'all') {
						for(let [channel, foo] of message.channel.guild.channels.cache) {
							setPerm(channel, true)
						}
						message.channel.send({ embed: Data.replaceEmbed({
							title: `🟢 All channels now enabled!`,
							description: `You can use \`{prefix}perm\` to list the channels.`
						})})
					} else {
						setPerm(message.mentions.channels.first().id, true, message.channel)
					}
				} else {	// List the permissions of all channels
					showPerm(message)
				}
			},
		}, {
			name: 'Color Setting',
			alias: ['color', 'setColor', 'botColor', 'configColor'],
			description: `Update the default color I'm using for all my embeds!`,
			usage: [
				['color', 'Show the current color'],
				['color <hex>', 'Set a new color (e.g. #d2da87)']
			],
			public: false,
			developer: false,
			guildOnly: true,
			execute(message, args) {
				if(args.length > 0) {
					const color = Tools.parseHex(args[0])
					if(color !== undefined) {
						Data.set('color', color)
						showColor(message)
					} else {
						Tools.fault(message.channel, `That isn't a valid hex code!`)
					}
				} else {
					showColor(message)
				}
			}
		}
	]
}


/**
 * Set the permissions of a channel
 * @param {string} channel The ID of the channel to set
 * @param {boolean} enabled Whether to set it enabled or not
 * @param {Discord.TextChannel} msgChannel Channel to send fault messages to
 */
function setPerm(channel, enabled, msgChannel) {
	
	if(channel === undefined) return Tools.fault(msgChannel, `I can't find that channel!`)
	if(!enabled && Data.get(`disabled.${channel}`)) return Tools.fault(msgChannel, `That channel is already disabled!`)
	if(enabled && !Data.get(`disabled.${channel}`)) return Tools.fault(msgChannel, 'That channel is already enabled!')

	Data.set(enabled ? 'enabled' : 'disabled', channel)
	if(msgChannel !== undefined) msgChannel.send({ embed: Data.replaceEmbed({
		title: enabled ? '🟢 I\'ve enabled that channel!' : `🔴 I've disabled that channel!`,
		description: `Now I won't be able to use <#${channel}> ;-; \nYou can use \`{prefix}perm\` to list the channels.`
	})});
}

function showPerm(message) {


	// Filter only category and text channels
	let categories = []
	let soloChannels = []
	for(const [_, category] of message.channel.guild.channels.cache) {
		if(category.type === 'text' && category.parent === null) soloChannels.push(category)
		if(category.type !== 'category') continue;
		channels = { category: category, channels: [] }
		for(const [_, channel] of category.children) {
			if(!message.member.permissionsIn(channel).has('VIEW_CHANNEL')) continue;
			if(channel.type === 'text') channels.channels.push(channel)
		}
		if(channels.channels.length > 0) categories.push(channels)
	}

	// Sort channels
	soloChannels.sort((a, b) => a.position - b.position)
	categories.sort((a, b) => a.category.position - b.category.position)
	for(const category in categories) {
		categories[category].channels.sort((a, b) => a.position - b.position)
	}

	message.channel.send({embed: Data.replaceEmbed({
		title: 'Channel Permissions',
		description: soloChannels.map((channel) => `${Data.get(`disabled.${channel.id}`) ? '🔴' : '🟢'} <#${channel.id}>`).join('\n'),
		fields: categories.map((category) => { return {
			name: category.category.name,
			value: category.channels.map((channel) => `${Data.get(`disabled.${channel.id}`) ? '🔴' : '🟢'} <#${channel.id}>`).join('\n'),
			inline: true
		}})
	})})
}


function showColor(message) {
	message.channel.send({
		embed: Data.replaceEmbed({
			title: 'Color is Set to: {color}',
			image: { url: 'attachment://color.jpg' }
		}),
		files: [{
			attachment: Tools.createColorImage(Data.get('color'), 600, 200),
			name: 'color.jpg'
		}]
	})
}