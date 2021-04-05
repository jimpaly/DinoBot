import { oneLine, stripIndents } from 'common-tags'
import { TextChannel } from 'discord.js'
import { CommandoClient, Command, CommandoMessage } from "discord.js-commando"
import { Fun } from '../../database'
import { Tools, Discord, Time, Obj } from '../../tools'

module.exports = class CountingCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'reactions',
            aliases: ['reaction', 'react', 'text', 'txt'],
            group: 'fun',
            memberName: 'reactions',
            description: 'Reactions',
            details: oneLine`
                Sometimes I will react to messages you send! 
                You can use this command to enable or disable that ;-;
            `,
			examples: [
				"`{prefix}reactions (enable|disable)` Set whether or not I should react to your messages",
			],
            args: [{
                key: 'option',
                prompt: 'Do you want to enable or disable reactions?',
                type: 'string',
                validate: (arg: string) => ['enable', 'disable', 
                    'on', 'off', 'true', 'false', 'yes', 'no'].includes(arg),
                parse: (arg: string) => ['enable', 'on', 'true', 'yes'].includes(arg) ? 'enable' : 'disable',
                default: ''
            }],
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    async run(message: CommandoMessage, { option }: { option: string }) {
        if(option === 'enable') {
            Fun.enableReactionTo(message.author.id)
        } else if(option === 'disable') {
            Fun.disableReactionTo(message.author.id)
        }
        return message.embed(await Discord.embed({
            title: 'Reaction Preference of {member.name}',
            description: `{member.reactions}!`,
            thumbnail: { url: '{member.avatar}' }
        }, {message}))
    }
}