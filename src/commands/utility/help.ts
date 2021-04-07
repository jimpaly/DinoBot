import { stripIndents, oneLine } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'
import { Config } from '../../database'
import { Discord } from '../../tools'

module.exports = class HelpCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'help',
            aliases: ['h', 'command', 'commands'],
            group: 'utility',
            memberName: 'a',
            description: 'Help',
            details: stripIndents`
                The help menus tell you how to use specific commands! Here are some tips on the formatting I use:
                - An **angle bracket** (\`<>\`) means you are *required* to provide something in place as described.
                - A **square bracket** (\`[]\`) means the replacement is *optional* and you may just delete the thing entirely.
                - Parentheses, like \`()\`, are different from brackets. Write the keword inside exactly as shown, but the keyword is now optional!
                - I also have the vertical bar (\`|\`) which means "or", so you can use any one of the given keywords.
            `,
			examples: [
				'`{prefix}help` List all the command categories',
				'`{prefix}help <command>` Show information about a command',
			],
            guarded: true,
            args: [{
                key: 'command',
                prompt: 'What command do you want help on?',
                type: 'string',
                default: '',
                error: Config.replace(oneLine`I don't have that command! 
                    Try \`{prefix}help\` to see a list of all the commands I have`),
                validate: (arg: string) => this.client.registry.findCommands(arg, true)
                    .some(command => !command.hidden),
                parse: (arg: string) => this.client.registry.findCommands(arg, true)
                    .find(command => !command.hidden),
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    async run(message: CommandoMessage, { command }: { command: Command }) {

        if(command) {   // If a command is mentioned, send info about that command
            return message.embed(await Discord.embed({
                title: command.description,
                description: command.details,
                fields: [{
                    name: 'Usage',
                    value: command.examples.join('\n')
                }, {
                    name: 'Aliases',
                    value: `\`${command.name}\` ${command.aliases.length > 0 ? 
                            '`' + command.aliases.join('` `') + '`' : ''}`
                }, {
                    name: 'More Info',
                    value: stripIndents`
                        Server only: ${command.guildOnly ? 'yes' : 'no'}
                        Admin command: ${command.userPermissions?.includes('ADMINISTRATOR') ? 'yes' : 'no'}
                    `
                }]
            }))
        } else {    // If no command is mentioned list all commands
            return message.embed(await Discord.embed({
                title: 'All Commands',
                description: "Use `{prefix}help <command>` to show how to use a specific command.",
                fields: this.client.registry.groups.filter(group => {
                    return group.commands.some(command => !command.hidden)
                }).map((group) => { return {
                    name: group.name,
                    value: '`' + group.commands.filter(command => !command.hidden)
                        .map((command) => command.name).join('` `') + '`'
                }})
            }))
        }
    }
}