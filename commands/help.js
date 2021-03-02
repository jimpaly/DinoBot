//jshint esversion: 6

const Tools = require('../tools.js');

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
			for(const [name, command] of message.client.commands) {
				if(args.length < 1) break;
				if(!command.alias.includes(args[0])) continue;
				embed = {
					title: command.name,
					author: {name: command.description},
					description: Tools.replace(command.detail),
					fields: [
						{ name: 'Usage', value: name === 'Help' ? '' : Tools.replace('*(Try `{prefix}help help` to learn about what \`<>\` and \`[]\` mean!)*') },
						{ name: 'Alias', value: '`'+command.alias.join('`, `')+'`' }
					]
				};
				for(const [format, role] of command.usage) embed.fields[0].value += Tools.replace('\n> `{prefix}'+format+'` '+role);
				message.channel.send({embed: embed});
				return;
			}
			embed = {
				title: 'Commands',
				description: Tools.replace('`{prefix}help <command>` to show how to use a specific command.')
			}
			for(const [name, command] of message.client.commands) {
				embed.description += Tools.replace('\n> `{prefix}'+command.alias[0]+'` '+command.description);
			}
			message.channel.send({embed: embed});
    }
};
