import { oneLine, stripIndents } from 'common-tags'
import { TextChannel } from 'discord.js'
import { CommandoClient, Command, CommandoMessage } from "discord.js-commando"
import { Fun } from '../../database'
import { Tools, Discord, Time, Obj } from '../../tools'

module.exports = class CountingCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'counting',
            aliases: ['count', 'counts', 'counter'],
            group: 'fun',
            memberName: 'counting',
            description: 'Counting Game',
            details: stripIndents`
                Play the counting game in {counting.channel}!
                This command is used to set that counting channel.
            `,
			examples: [
				"`{prefix}counting [#channel]` Set the channel to play the counting game in!",
			],
            args: [{
                key: 'channel',
                prompt: 'Which channel do you want the counting game to be in?',
                type: 'text-channel',
                default: ''
            }],
            guildOnly: true,
            userPermissions: ['ADMINISTRATOR']
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    async run(message: CommandoMessage, { channel }: { channel: TextChannel }) {
        if(channel) {
            Fun.setCountingChannel(channel.id)
        }
        return message.embed(await Discord.embed({
            description: 'Counting channel set to: {counting.channel}'
        }))
    }
}