import { stripIndents } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord, Tools } from '../../tools'

module.exports = class LevelCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'level',
            aliases: ['levels', 'leveling', 'lvl', 'points', 'point', 'pts', 'score', 'scores'],
            group: 'stats',
            memberName: 'level',
            description: 'Level Stats',
            details: stripIndents`
                Stay active to gain points and level up!
                There are a bunch of ways to gain levels, including messaging, inviting, voice chatting, and more!
                Visit {levels.channel} to learn more!
            `,
			examples: [
				"`{prefix}level` Show your levels and points",
				"`{prefix}level <member>` Show someone's levels",
			],
            args: [{
                key: 'member',
                prompt: 'Which member do you want to show the level of?',
                type: 'member',
                default: '',
                error: `I can't seem to find that member!`,
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    

    async run(message: CommandoMessage, { member }: { member: Discord.User }) {
        if(!member) member = message.member ?? message.author
        return message.embed(await Discord.embed(Stats.statCard('points'), {member}))
    }

}