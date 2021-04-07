import { oneLine, stripIndents } from 'common-tags'
import { CommandoClient, Command, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord } from '../../tools'

module.exports = class LeaderboardCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'leaderboard',
            aliases: ['lb', 'ranks', 'ranking', 'rank', 'top'],
            group: 'stats',
            memberName: 'leaderboard',
            description: 'Leaderboard',
            details: stripIndents`List everybody's levels!
                \`<category>\` can be the following: 
                > ${'`points`, `messages`, `voice`, `bumps`, `counts`'}
                > \`daily total|current|highest\` (default: \`current\`)
                > \`reps received|given|stored\` (default: \`stored\`)
                > \`invites joined|here|stayed\` (default: \`joins\`)
                \`<time period>\` includes the following: 
                ${'`allTime` `daily`, `weekly`, `monthly`, `annual`'}`,
			examples: [
				"`{prefix}leaderboard <category>` Show top members in a certain category!",
				"`{prefix}leaderboard <category> <time period>` Show top members in a certain category!",
			],
            args: [{
                key: 'options',
                prompt: 'Which stat do you want to show the leaderboard of?',
                type: 'string',
                infinite: true,
                default: []
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    async run(message: CommandoMessage, { options }: { options: string[] }) {

        // Get the stat
        let idx = options.findIndex(option => Stats.resolveStat(option) !== null)
        const stat: Stats.StatType = idx < 0 ? 'points' : Stats.resolveStat(options.splice(idx, 1)[0]) ?? 'points'

        // Get the time period
        idx = options.findIndex(option => Stats.resolveTime(option) !== null)
        const time: Stats.TimePeriod = idx < 0 ? 'monthly' : Stats.resolveTime(options.splice(idx, 1)[0]) ?? 'monthly'

        // Get the stat option
        let option: Stats.DailyType | Stats.RepsType | Stats.InviteDisplayType | '' = ''
        if(stat === 'daily') {
            const opt = options.find(option => Stats.resolveDailyType(option))
            option = Stats.resolveDailyType(opt ?? '') ?? 'current'
        } else if(stat === 'reps') {
            const opt = options.find(option => Stats.resolveRepsType(option))
            option = Stats.resolveRepsType(opt ?? '') ?? 'received'
        } else if(stat === 'invites') {
            const opt = options.find(option => Stats.resolveInviteDisplayType(option))
            option = Stats.resolveInviteDisplayType(opt ?? '') ?? 'joined'
        }

        // Parse stat, time period, and option into single string
        let statStr: string = `${stat}.${time}`
        if(option) statStr += `.${option}`

        // Make the leaderboard
        let lb = await message.say('Loading leaderboard...')
        return Discord.page(lb, Math.ceil((await Stats.count())/10), async page => {

            const users = await Stats.getScores().sort(`-${statStr}`).skip((page-1)*10).limit(10)
            const user = await Stats.get(message.author.id)
            const place = await Stats.getPlace(statStr, user.getStat(stat, time, option||undefined))
            const count = await Stats.count()
            
            return Discord.embed({  // TODO: better description
                title: (['', 'Daily', 'Weekly', 'Monthly', 'Annual'][Stats.timePeriods.indexOf(time)]) +
                    ' ' + (['Leveling', 'Messaging', 'Voice Chat', 'Daily', 'Reputation', 'Invite', 
                    'Disboard Bumping', 'Counting Game'][Stats.statTypes.indexOf(stat)] ?? '') + ' Leaderboard',
                description: `${stat === 'reps' ?
                        option === 'given' ? 'Now viewing the amount of given reps' :
                        option === 'received' ? 'Now viewing the amount of received reps' :
                        `Hint: to view the given and received reps individually,
                        try \`{prefix}leaderboard rep given|received ${time}\`` :
                    stat === 'invites' ?
                        option === 'current' ? `Now only counting invites currently in the server` :
                        option === 'stayed' ? 'Now only counting invites who never left' :
                        `Hint: to not count invites who aren't in the server,
                        try \`{prefix}leaderboard invite current|stayed ${time}\`` : ''}
                    **${place}. <@!${user._id}> - ${user.getStat(stat, time, option||undefined)}**`,
                fields: [{
                    name: '——————————',
                    value: await Promise.all(users.map(async user => {
                        const score = 
                            stat === 'daily' ? user.daily[time][option as Stats.DailyType] :
                            stat === 'reps' ? user.reps[time][option as Stats.RepsType] :
                            stat === 'invites' ? user.invites[time][option as Stats.InviteDisplayType] :
                            user[stat][time]
                        const place = await Stats.getPlace(statStr, score)
                        let str = `${place}. <@!${user._id}> - ${score}`
                        if(user._id === message.author.id) return `**${str}**`
                        return str
                    }))
                }],
                footer: { text: `${(page-1)*10+1}-${Math.min(page*10, count)} / ${count}` },
                timestamp: Date.now(),
            })
        })
    }
}