import { oneLine, stripIndents } from 'common-tags'
import { CommandoClient, Command, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord, Time } from '../../tools'

module.exports = class DailyCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'daily',
            aliases: ['streak', 'reward'],
            group: 'stats',
            memberName: 'daily',
            description: 'Daily Streak',
            details: oneLine`
                Earn daily rewards! Resets ever day at 0:00 AM. 
                You can set it to follow your timezone with \`{prefix}timezone\`.
                Otherwise, I'll use UTC (GMT+0)
            `,
			examples: [
				"`{prefix}daily` Claim your daily reward!",
			]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    async run(message: CommandoMessage) {

        let user = await Stats.get(message.author.id)
        let cooldown = user.getDailyCooldown()
        let streak = user.daily.current

        user.claimDaily()

        // Send a log
        if(cooldown < 0) Stats.log(oneLine`
            <@!${user._id}> just claimed their daily 
            reward of {stats.daily.${(user.daily.current-1)%7+1}}
        `, [user._id], [])

        // Send stats about the member's daily rewards
        return message.embed(await Discord.embed({
            title: `Daily Streak Stats of {member.name}`,
            description: stripIndents`
                ${cooldown < -Time.day && streak > 0 ? 
                    `Oh no! You lost your daily streak at ${streak}` : ''}
                ${cooldown < 0 ? 
                    `👍 Daily reward received! (+{stats.daily.${(user.daily.current-1)%7+1}})` : ''}
                Your next reward will be ready in {member.daily.cooldown}`,
            thumbnail: {url: '{member.avatar}'},
            fields: [{
                name: 'Current Streak',
                value: `{member.daily.current}`,
                inline: true
            }, {
                name: 'Highest Streak',
                value: `{member.daily.highest}`,
                inline: true
            }, {
                name: 'Total Claimed',
                value: `{member.daily.total}`,
                inline: true
            }]
        }, { message, user }))
    }
}