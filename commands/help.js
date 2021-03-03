const Data = require('../bot.js')

module.exports = {
    name: 'Help',
    description: 'Show the help menus',
	detail: `The help menus tell you how to use specific commands! Here are some tips on the formatting I use:
- An **angle bracket** (\`<>\`) means you are *required* to provide something in place as described.
- A **square bracket** (\`[]\`) means the replacement is *optional* and you may just delete the thing entirely.
- Parentheses, like \`()\`, are different from brackets. Write the keword inside exactly as shown, but the keyword is now optional!
- I also have the vertical bar (\`|\`) which means "or", so you can use any one of the given keywords.`,
    alias: ['help'],
    usage: [
			['help [command]', 'I\'ll list all the commands you can give me, or information about a specific command!']
		],
    public: true,
    developer: false,
    guildOnly: false,
    execute(message, args) {

		const commands = Data.getAllCommands()

		// Find mentioned command and send details
		for(const name in commands) {
			const command = commands[name]
			if(args.length < 1) break
			if(!command.alias.includes(args[0].toLowerCase())) continue
			embed = {
				title: command.name,
				author: {name: command.description},
				description: command.detail,
				fields: [
					{ name: 'Usage', value: name === 'Help' ? '' : '*(Try `{prefix}help help` to learn about what \`<>\` and \`[]\` mean!)*' },
					{ name: 'Alias', value: '`'+command.alias.join('`, `')+'`' }
				]
			}
			for(const [format, role] of command.usage) embed.fields[0].value += `\n> \`{prefix}${format}\` ${role}`
			message.channel.send({embed: Data.replace(embed)})
			return
		}

		// If no command was mentioned, list all commands
		embed = {
			title: 'Commands',
			description: '`{prefix}help <command>` to show how to use a specific command.'
		}
		for(const command in commands) {
			embed.description += `\n> \`{prefix}${commands[command].alias[0]}\` ${commands[command].description}`
		}
		message.channel.send({embed: Data.replace(embed)})
    }

};