import { oneLine, stripIndents } from 'common-tags'
import { CommandoClient, Command, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord } from '../../tools'

module.exports = class StatsCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'stats',
            aliases: ['stat', 'detail', 'details'],
            group: 'stats',
            memberName: 'stats',
            description: 'Detailed Stats',
            details: stripIndents`
                Show the detailed leveling stats of someone
                Categories include: ${'`level`, `messages`, `voice`, `daily`, `reps`, `invites`, `bumps`, and `counts`'}
            `,
			examples: [
				"`{prefix}stats` Show a summary of your stats",
				"`{prefix}stats <category>` Show your stats for a specific category (see above description)",
				"`{prefix}stats <member>` Show a summary of someone else's stats",
				"`{prefix}stats <member> <category>` Show someones else's stats for categories (see above description)",
			],
            args: [{
                key: 'member',
                prompt: 'Which member do you want to show the level of?',
                type: 'string',
                default: '',
                validate: async (arg: string) => await Discord.findMember(arg) !== undefined 
                                                     || Stats.resolveStat(arg) !== null,
                parse: async (arg: string) => await Discord.findMember(arg) || Stats.resolveStat(arg),
                error: `I can't seem to find that member!`,
            }, {
                key: 'category',
                prompt: 'Which category do you want to show?',
                type: 'string',
                default: '',
                validate: (arg: string) => Stats.resolveStat(arg) !== null,
                parse: (arg: string) => Stats.resolveStat(arg),
                error: oneLine`That isn't a valid category! It needs to be 
                    one of these: \`${Stats.statTypes.join('`, `')}\``
            }]
        })
    }

    async run(message: CommandoMessage, { member, category }: 
        { member: Discord.User | Stats.StatType, category: Stats.StatType }) {
        if(typeof member === 'string') {
            category = member
            member = message.member ?? message.author
        }
        return message.embed(await Discord.embed(Stats.statCard(category || 'all'), {member}))
    }

}