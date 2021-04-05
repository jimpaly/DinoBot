import { oneLine, stripIndents } from 'common-tags'
import { Collection, GuildChannel, TextChannel } from 'discord.js'
import { CommandoClient, Command, CommandoMessage } from "discord.js-commando"
import { Fun } from '../../database'
import { Tools, Discord, Time, Obj } from '../../tools'

module.exports = class ReactionsPermCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'reactionperm',
            aliases: ['reactionsperm', 'reactperm', 'textperm', 'txtperm'],
            group: 'fun',
            memberName: 'reactionperm',
            description: 'Reaction Permissions',
            details: oneLine`
                Sometimes I will react to messages you send! 
                You can use this command to enable or disable that ;-;
            `,
			examples: [
				'`{prefix}reactionPerm` List all channel reaction permissions',
				'`{prefix}reactionPerm enable|disable <#channels>...` enable or disable reactions in a channel',
				'`{prefix}reactionPerm enable|disable all` enable or disable my access to all channel',
			],
            args: [{
                key: 'status',
                prompt: 'Do you want to enable or disable reactions?',
                type: 'string',
                validate: (arg: string) => ['enable', 'disable', 
                    'on', 'off', 'true', 'false', 'yes', 'no'].includes(arg),
                parse: (arg: string) => ['enable', 'on', 'true', 'yes'].includes(arg) ? 'enable' : 'disable',
                default: ''
            }, {
                key: 'channels',
                prompt: 'Which channels do you want to enable/disable?',
                type: 'string',
                infinite: true,
                default: new Collection(),
                parse: (arg: string) => Discord.findChannels(arg, ['text', 'news']) 
            }],
            userPermissions: ['ADMINISTRATOR'],
            guildOnly: true,
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    async run(message: CommandoMessage, { status, channels: channelsCollections }: { 
        status: string, channels: Collection<string, GuildChannel>[] }) {
        let channels = new Collection<string, GuildChannel>().concat(...channelsCollections)
        if(status === 'disable') {		// Disable a channel
            channels.forEach(channel => Fun.disableReactionIn(channel.id))
            return message.embed(await Discord.embed({
                title: `🔴 Reactions are now disabled in the following channels!`,
                description: channels.map(channel => `<#${channel.id}>`).join(' ')
            }))
        } else if(status === 'enable') {	// Enable a channel
            channels.forEach(channel => Fun.enableReactionIn(channel.id))
            return message.embed(await Discord.embed({
                title: `🟢 Reactions are now enabled in the following channels!`,
                description: channels.map(channel => `<#${channel.id}>`).join(' ')
            }))
        } else {	// List the permissions of all channels
            return Discord.listChannels(message, 'Channel Perms', ['text', 'news'], channel => 
                `{reactions.perm.${channel.id}} {channel}`)
        }
    }
}