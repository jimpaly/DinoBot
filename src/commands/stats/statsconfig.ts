import { stripIndents } from 'common-tags'
import { Collection, GuildChannel } from 'discord.js'
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord, Tools } from '../../tools'

module.exports = class StatsConfigCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'statconfig',
            aliases: ['statsconfig', 'levelconfig', 'levelsconfig', 'levelingconfig', 'statsettings', 'statsetting', 'levelsettings', 'levelsetting'],
            group: 'stats',
            memberName: 'statconfig',
            description: 'Stats/Leveling Configuration',
            details: stripIndents`
                Set different stats/leveling settings (cooldowns are in minutes)
                Here are the categories and their settings:
                > ${'`messages` and `voice`: `[min points] [max points] [cooldown]`'}
                > ${'`reps`: `[give points] [receive points]`'}
                > ${'`invites`, `bumps`, and `counts`: `[points]'}
                For \`daily\`, the last day rewards reps
            `,
			examples: [
				"`{prefix}statconfig` Show settings for all the categories",
				"`{prefix}statconfig <category> [settings]` Set points gained through the category",
				"`{prefix}statconfig daily [points]...` Set points gained from daily reward (7 days)",
				"`{prefix}statconfig levels [level] [points]...` Set amount of points required for levels",
				"`{prefix}statconfig channel (enable|disable) [#channels]...|(all)` Set channels members can gain points in",
				"`{prefix}statconfig log [#channels]` Set the channel for posting logs and the live leaderboard",
			],
            args: [{
                key: 'option',
                prompt: 'Which command option do you want to execute?',
                type: 'string',
                default: '',
            }, {
                key: 'args',
                prompt: 'Enter the arguments for that option!',
                type: 'string',
                infinite: true,
                default: [],
            }],
            guildOnly: true,
            userPermissions: ['ADMINISTRATOR']
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    

    async run(message: CommandoMessage, { option, args }: { option: string, args: string[] }) {
        let category = Stats.resolveStat(option)
        if(['', 'show', 'list', 'all', 'settings'].includes(option)) {
            return message.embed(await Discord.embed({
                title: 'Stats Configuration',
                fields: Stats.statTypes.filter(stat => !['points', 'daily'].includes(stat))
                .map((stat: Stats.StatType) => { return {
                    name: stat,
                    inline: true,
                    value: (stat !== 'reps' ? `{stats.${stat}}` : 
                    '{stats.reps.give} for giving\n{stats.reps.receive} for receiving') +
                    (['messages', 'voice', 'reps'].includes(stat) ? ` every {stats.${stat}.cooldown}`:''),
                }})
            }))
        } else if(category === 'messages' || category === 'voice') {
            Stats.setStat(category, { 
                min: Tools.parseNumber(args[0]),
                max: Tools.parseNumber(args[1]),
                cooldown: Tools.parseNumber(args[2]),
            })
            return message.embed(await Discord.embed({
                title: (category === 'messages' ? 'Messaging' : 'Voice') + ' Settings',
                description: stripIndents`
                    {stats.${category}}
                    {stats.${category}.cooldown}`
            }))
        } else if(category === 'reps') {
            Stats.setStat('reps', {
                give: Tools.parseNumber(args[1]),
                receive: Tools.parseNumber(args[2]),
                cooldown: Tools.parseNumber(args[3]),
            })
            return message.embed(await Discord.embed({
                title: 'Reputation Settings',
                description: stripIndents`
                    {stats.reps.give} (give)
                    {stats.reps.receive} (receive)
                    {stats.reps.cooldown}`
            }))
        } else if(['invites', 'bumps', 'counts'].includes(category ?? '')) {
            Stats.setStat(category as 'invites'|'bumps'|'counts', {
                amount: Tools.parseNumber(args[1]),
            })
            return message.embed(await Discord.embed({
                title: `${category?.charAt(0)?.toUpperCase()}${category?.slice(1)} Settings`,
                description: `{stats.${category}}`,
            }))
        } else if(option === 'daily') {
            args.slice(0, 7).forEach((arg, idx) => {
                if(Tools.isNumber(arg)) Stats.setDaily(idx+1, parseInt(arg), false)
            })
            Stats.saveConfig()
            return message.embed(await Discord.embed({
                title: `Daily Rewards Settings`,
                description: `{stats.daily}`,
            }))
        } else if(['levels', 'level', 'leveling'].includes(option)) {
            if(Tools.isNumber(args[0])) args.slice(1).forEach((arg, idx) => {
                if(Tools.isNumber(arg)) Stats.setLevel(parseInt(args[0])+idx, parseInt(arg), false)
            }) 
            Stats.saveConfig()
            return message.embed(await Discord.embed({
                title: `Levels`,
                description: `{stats.levels}`,
            }))
        } else if(['channel', 'channels', 'perm', 'perms'].includes(option)) {
            const status = args.splice(0, 1)[0] ?? ''
            let channels = new Collection<string, GuildChannel>()
            .concat(...args.map(arg => Discord.findChannels(arg)))
            if(['disable', 'off'].includes(status)) {		// Disable a channel
                channels.forEach(channel => Stats.disableChannel(channel.id, false))
                Stats.saveConfig()
                return message.embed(await Discord.embed({
                    title: `🔴 The following channels are now disabled!`,
                    description: channels.map(channel => `<#${channel.id}>`).join(' ')
                }))
            } else if(['enable', 'on'].includes(status)) {	// Enable a channel
                channels.forEach(channel => Stats.enableChannel(channel.id, false))
                Stats.saveConfig()
                return message.embed(await Discord.embed({
                    title: `🟢 The following channels are now enabled!`,
                    description: channels.map(channel => `<#${channel.id}>`).join(' ')
                }))
            } else {	// List the permissions of all channels
                return Discord.listChannels(message, 'Channel Perms', ['text', 'voice','news'], 
                    channel => `${Stats.isChannelEnabled(channel.id) ? '🟢' : '🔴'} {channel}`)
            }
        } else if(['log', 'logging', 'logs'].includes(option)) {
            let channel = Discord.findChannel(args[0])
            if(channel) Stats.setLogChannel(channel.id)
            return message.embed(await Discord.embed({
                description: stripIndents`
                    Logging channel: {stats.log}
                    Live leaderboard: [link]({stats.log.leaderboard})`
            }))
        } else {
            return message.say('bloop')
        }
    }

}