import { stripIndents, oneLine } from 'common-tags'
import { createCommand } from '../../bot-framework'
import { makeNavigator } from '../../tools/tools'

module.exports = createCommand<{
	command?: string
}>({
	name: 'help',
	description: 'Display useful info on various commands',
	aliases: ['h', 'command', 'commands'],
	type: 'both',
	args: {
		command: {
			description: 'The specific command to get info on',
			type: 'string',
			optional: true,
		}
	},
	async execute({command}, reply) {
		if(command) {   // If a command is mentioned, send info about that command
			return 'feature not available yet'
				// return message.embed(await Discord.embed({
				// 		title: command.description,
				// 		description: command.details,
				// 		fields: [{
				// 				name: 'Usage',
				// 				value: command.examples.join('\n')
				// 		}, {
				// 				name: 'Aliases',
				// 				value: `\`${command.name}\` ${command.aliases.length > 0 ? 
				// 								'`' + command.aliases.join('` `') + '`' : ''}`
				// 		}, {
				// 				name: 'More Info',
				// 				value: stripIndents`
				// 						Server only: ${command.guildOnly ? 'yes' : 'no'}
				// 						Admin command: ${command.userPermissions?.includes('ADMINISTRATOR') ? 'yes' : 'no'}
				// 				`
				// 		}]
				// }))
		} else {    // If no command is mentioned list all commands
			const message = await reply('loading commands...')
			await makeNavigator(message, [{
				name: 'Help Menu',
				description: 'main help menu page',
			}, {
				name: 'All Commands',
				description: 'list of all commands'
			}].concat(global.modules
				.filter(module => module.commands.some(command => !command.hidden))
				.map(module => {return {
					name: module.name,
					description: 'description',
					placeholder: 'Commands',
					subItems: module.commands
						.filter(command => !command.hidden)
						.map(command => {return {
							name: command.name,
							description: command.description,
						}})
				}})
			), (name, level) => {
				if (level == 0) {
					if (name === 'Help Menu') return {
						title: 'Help Menu',
						description: stripIndents`
							The help menu tell you how to use specific commands! Here are some tips on the formatting I use:
							- An **angle bracket** (\`<>\`) means you are *required* to provide something in place as described.
							- A **square bracket** (\`[]\`) means the replacement is *optional* and you may just delete the thing entirely.
							- Parentheses, like \`()\`, are different from brackets. Write the keword inside exactly as shown, but the keyword is now optional!
							- I also have the vertical bar (\`|\`) which means "or", so you can use any one of the given keywords.
						`,
					} 
					else if (name === 'All Commands') return {
						title: 'All Commands',
						fields: global.modules
						.filter(module => module.commands.some(command => !command.hidden))
						.map(module => { return {
							name: module.name,
							value: '`' + module.commands
								.filter(command => !command.hidden)
								.map((command) => command.name)
								.join('` `') + '`'
						}})
					} 
					else return {
						title: `${name}`
					}
				} else {
					const command = global.modules.getCommand(name)
					if (command) return {
						title: command.name,
						description: command.details || command.description,
						fields: [{
							name: 'Aliases',
							value: '`' + [command.name].concat(command.aliases).join('` `') + '`'
						}, {
							name: 'More Info',
							value: stripIndents`
								Server only: ${command.guildOnly ? 'yes' : 'no'}
								Admin command: ${command.permission ? 'yes' : 'no'}
								Text command: ${command.type != 'slash' ? 'yes' : 'no'}
								Slash command: ${command.type != 'text' ? 'yes' : 'no'}
							`
						}]
					}
					else return {
						title: `Oof!`,
						description: `It seems like I can't find any info on that command!`
					}
				}
			})
		}
	}
})