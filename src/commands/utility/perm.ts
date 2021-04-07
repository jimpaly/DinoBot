import { oneLine } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando'
import { Collection, GuildChannel, CategoryChannel } from 'discord.js'
import { Config } from '../../database'
import { Discord } from '../../tools'

module.exports = class ChannelPermCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'perm',
            aliases: ['perms', 'permission', 'permissions'],
            group: 'utility',
            memberName: 'perm',
            description: 'Channel Permissions',
            details: oneLine`
                🥺 You can change which channels I have access to...
            `,
			examples: [
				'`{prefix}perm` List all channel permissions',
				'`{prefix}perm enable|disable <#channels>...` enable or disable my access to a channel',
				'`{prefix}perm enable|disable all` enable or disable my access to all channel',
			],
            args: [{
                key: 'status',
                prompt: 'Do you want to enable or disable the channel?',
                type: 'string',
                default: '',
                parse: (arg: string) => {
                    if(['disable', 'off'].includes(arg)) return 'disable'
                    if(['enable', 'on'].includes(arg)) return 'enable'
                }
            }, {
                key: 'channels',
                prompt: 'Which channel do you want to enable or channel?',
                type: 'string',
                infinite: true,
                default: new Collection(),
                parse: (arg: string) => Discord.findChannels(arg, ['text', 'news']) 
                // {
                //     const filter = (channel: GuildChannel) => ['text', 'news'].includes(channel.type)
                //     if(arg === 'all') return Discord.guild.channels.cache.filter(filter)
                //     const channel = Discord.findChannel(arg, ['text', 'news', 'category'])
                //     if(channel) {
                //         if(channel.type === 'category') return (channel as CategoryChannel).children.filter(filter)
                //         return new Collection([[channel.id, channel]])
                //     }
                // }
            }],
            userPermissions: ['ADMINISTRATOR'],
            guildOnly: true,
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    

    async run(message: CommandoMessage, { status, channels: channelsCollections }: { 
        status: string, channels: Collection<string, GuildChannel>[] }) {
        let channels = new Collection<string, GuildChannel>().concat(...channelsCollections)
        if(status === 'disable') {		// Disable the channels
            if(channels.size > 1) channels = channels
                .filter(channel => channel.id !== message.channel.id)
            Config.disableChannels(...channels.map(channel => channel.id))
            return message.embed(await Discord.embed({
                title: `🔴 The following channels are now disabled!`,
                description: channels.map(channel => `<#${channel.id}>`).join(' ')
            }))
        } else if(status === 'enable') {	// Enable the channels
            Config.enableChannels(...channels.map(channel => channel.id))
            return message.embed(await Discord.embed({
                title: `🟢 The following channels are now enabled!`,
                description: channels.map(channel => `<#${channel.id}>`).join(' ')
            }))
        } else {	// List the permissions of all channels
            return Discord.listChannels(message, 'Channel Perms', ['text', 'news'], channel => 
                `${Config.isChannelEnabled(channel.id) ? '🟢' : '🔴'} {channel}`)
        }
    }

}