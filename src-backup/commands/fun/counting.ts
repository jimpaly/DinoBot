import { SlashCommandBuilder } from '@discordjs/builders'
import { ApplyOptions } from '@sapphire/decorators'
import { Args, Command, CommandOptions } from '@sapphire/framework'
import { stripIndents } from 'common-tags'
import { Interaction, Message, TextChannel } from 'discord.js'
import { Fun } from '../../database'
import { Discord } from '../../tools'

@ApplyOptions<CommandOptions>({
    name: 'counting',
    aliases: ['count', 'counts', 'counter'],
    description: 'Counting Game',
})
export class CountingCommand extends Command {

    // constructor(client: CommandoClient) {
    //     super(client, {
    //         name: 'counting',
    //         aliases: ['count', 'counts', 'counter'],
    //         group: 'fun',
    //         memberName: 'counting',
    //         description: 'Counting Game',
    //         details: stripIndents`
    //             Play the counting game in {counting.channel}!
    //             This command is used to set that counting channel.
    //         `,
	// 		examples: [
	// 			"`{prefix}counting [#channel]` Set the channel to play the counting game in!",
	// 		],
    //         args: [{
    //             key: 'channel',
    //             prompt: 'Which channel do you want the counting game to be in?',
    //             type: 'text-channel',
    //             default: ''
    //         }],
    //         guildOnly: true,
    //         userPermissions: ['ADMINISTRATOR']
    //     })
    // }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    public async messageRun(message: Message, args: Args) {
        // if(channel) {
        //     Fun.setCountingChannel(channel.id)
        // }
        // return message.embed(await Discord.embed({
        //     description: 'Counting channel set to: {counting.channel}'
        // }))
    }
}