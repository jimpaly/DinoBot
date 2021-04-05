import { oneLine, stripIndent } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord, Tools } from '../../tools'

module.exports = class RepCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'rep',
            aliases: ['reps', 'reputation'],
            group: 'stats',
            memberName: 'rep',
            description: 'Reputation',
            details: `Give rep to others to show your appreciation!`,
			examples: [
				"`{prefix}rep` Check your reps and also your cooldown",
				"`{prefix}rep <member>` Give a rep point to someone else",
			],
            args: [{
                key: 'member',
                prompt: 'Which member do you want to give your rep to?',
                type: 'member',
                default: '',
                error: `I can't seem to find that member!`,
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)
    
    async run(message: CommandoMessage, { member }: { member: Discord.User }) {
        if(!member) {
            return message.embed(await Discord.embed({
                title: `Rep Status of {member.name}`,
                thumbnail: { url: '{member.avatar}' },
                description: stripIndent`
                    **Your rep: {member.reps}**
                    ({member.reps.stored} available to give)`,
                fields: [{
                    name: 'Next rep in...',
                    value: `{member.reps.cooldown}`,
                    inline: true
                }, {
                    name: 'Last given to...',
                    value: `{member.reps.lastReceiver}`,
                    inline: true
                }, {
                    name: 'Last received from...',
                    value: `{member.reps.lastGiver}`,
                    inline: true
                }]
            }, { message }))
        } else {
            const user = await Stats.get(message.author.id)
            if(user.getRepCooldown() > 0) {
                return Discord.fault(message, oneLine`Please wait {member.reps.cooldown} 
                until you can give rep again!`, { message })
            } if(user.reps.stored <= 0) {
                return Discord.fault(message, `You don't have any rep left to give!`)
            } else if(member.id === user.reps.lastReceiver) {
                return Discord.fault(message, oneLine`You can't give rep 
                to the same person twice in a row! Try someone else!`)
            } else if(member.id === user.reps.lastGiver) {
                return Discord.fault(message, oneLine`Why are you giving the rep 
                back to the person who gave it to you? Try someone else!`)
            } else if(member.id === message.author.id) {
                return Discord.fault(message, `You can't give rep to yourself!`)
            } else {
                user.giveRep(member.id)
                const receiver = await Stats.get(member.id)
                receiver.receiveRep(message.author.id)
                Stats.log(oneLine`
                    <@!${user._id}> (+{stats.reps.give} points) just gave a rep
                    to <@!${receiver._id}> (+{stats.reps.receive} points)!
                `, [user._id], [receiver._id])
                return message.embed(await Discord.embed({
                    title: 'Rep Given!',
                    description: stripIndent`Given to <@!${member.id}>
                        You now have {member.reps.stored} rep left to give`
                }, {message}))
            }
        }
    }

}