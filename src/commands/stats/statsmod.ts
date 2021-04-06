import { oneLine, stripIndents } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord, Tools } from '../../tools'

module.exports = class StatsModCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'statmod',
            aliases: ['statsmod', 'levelmod', 'levelsmod', 'levelingmod'],
            group: 'stats',
            memberName: 'statmod',
            description: 'Stats/Leveling Moderation',
            details: stripIndents`Set leveling stats for different people. 
                \`<category>\` can be the following:
                > \`points\`, \`messages\`, \`voice\`, \`bumps\`, \`counts\`
                > \`daily total|current|highest\` (default: \`current\`)
                > \`reps received|given|stored\` (default: \`stored\`)
                > \`invites joins|leaves|returns\` (default: \`joins\`)
                
                \`<time period>\` can be the following:
                \`alltime\` (default), \`daily\`, \`weekly\`, \`monthly\`, \`annual\``,
			examples: [
				"`{prefix}statmod set <member> <amount> <category> <time period>` Set the stat of a person",
				"`{prefix}statmod add <member> <amount> <category>` Give someone more stats across all time periods",
			],
            args: [{
                key: 'command',
                prompt: 'Which command option do you want to execute? (`set` or `add`)',
                type: 'string',
                oneOf: ['set', 'add']
            }, {
                key: 'member',
                prompt: 'Which member do you want to set the stats of?',
                type: 'member',
            }, {
                key: 'amount',
                prompt: 'How much do you want to set/change?',
                type: 'integer',
            }, {
                key: 'options',
                prompt: 'Which stat do you want to change?',
                type: 'string',
                infinite: true,
            }],
            guildOnly: true,
            userPermissions: ['ADMINISTRATOR']
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    

    async run(message: CommandoMessage, { command, member, amount, options }: 
    { command: 'set'|'add', member: Discord.User, amount: number, options: string[] }) {

        let idx = options.findIndex(option => Stats.resolveStat(option.toLowerCase()) !== null)
        if(idx < 0) return Discord.fault(message, `You didn't enter a stat!`)
        const stat = Stats.resolveStat(options.splice(idx, 1)[0]) ?? 'points'

        idx = options.findIndex(option => (Stats.timePeriods as string[]).includes(option.toLowerCase()))
        const time = idx < 0 ? 'alltime' : options.splice(idx, 1)[0] as Stats.TimePeriod

        let user = await Stats.get(member.id)

        let amt: Stats.StatOptions = {}
        if(stat === 'daily') {
            const option = options.find(option => ['total','current','highest'].includes(option.toLowerCase()))
            amt[option as 'total'|'current'|'highest' ?? 'current'] = amount
        } else if(stat === 'reps') {
            const option = options.find(option => ['received','given','stored'].includes(option.toLowerCase()))
            amt[option as 'received'|'given'|'stored' ?? 'stored'] = amount
        } else if(stat === 'invites') {
            const option = options.find(option => ['joins','leaves','returns'].includes(option.toLowerCase()))
            amt[option as 'joins'|'leaves'|'returns' ?? 'joins'] = amount
        } else {
            amt.amount = amount
        }

        let messages: CommandoMessage[] = []
        messages.push(await message.embed(await Discord.embed(Stats.statCard(stat), {message, user}), '**Before:**'))

        if(command === 'set') {
            if(stat === 'daily') {
                let daily = time === 'alltime' ? user.daily : user.daily[time]
                if(amt.total) daily.total = amt.total
                if(amt.current) daily.current = amt.current
                if(amt.highest) daily.highest = amt.highest
            } else if(stat === 'reps') {
                let reps = time === 'alltime' ? user.reps : user.reps[time]
                if(amt.received) reps.received = amt.received
                if(amt.given) reps.given = amt.given
                if(amt.stored) {
                    if(time === 'alltime') user.reps.stored = amt.stored
                    else return Discord.fault(message, `You only set the stored rep for \`alltime\`!`)
                }
            } else if(stat === 'invites') {
                if(time === 'alltime') return Discord.fault(message, `You can't set alltime invites!`)
                if(amt.joins) user.invites[time].joins = amt.joins
                if(amt.leaves) user.invites[time].leaves = amt.leaves
                if(amt.returns) user.invites[time].returns = amt.returns
            } else {
                if(amt.amount) user[stat][time] = amt.amount
            }
            user.save()
        } else {
            user.addStat(stat, amt)
        }
        
        messages.push(await message.embed(await Discord.embed(Stats.statCard(stat), {message, user}), '**After:**'))
        return messages

    }

}