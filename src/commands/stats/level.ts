import { stripIndents } from 'common-tags'
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Discord } from '../../tools'
import * as Canvas from 'canvas'

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
        const user = await Stats.get(member.id)
        return message.embed(await Discord.embed({
            ...Stats.statCard('points'),
            image: { url: 'attachment://card.png' },
        }, {member, user}), '', { files: [{ 
            attachment: makeLevelingCard(user), 
            name: 'card.png' 
        }]})
    }

}

/** Generate an image with a progress bar and points indicators */
function makeLevelingCard(user: Stats.UserStat) {

    const width = 600, height = 80

    const canvas = Canvas.createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const level = user.getLevel()
    const pointsFrom = user.points.alltime-Stats.getLevel(level)
    const pointsTo = Stats.getLevel(level+1)-user.points.alltime

    // Points text
    ctx.fillStyle =  '#ffffffd0'
    ctx.font = `bold 24px Trebuchet MS`
    ctx.fillText(`${pointsFrom}/${pointsFrom+pointsTo}`, 20, 25)
    const metrics = ctx.measureText(`-${pointsTo}/${Stats.getLevel(level+1)}`)
    ctx.fillText(`-${pointsTo}/${Stats.getLevel(level+1)}`, width-metrics.width-20, 25)

    const barY = 35
    const barHeight = height-35

    // Outline/clipping mask
    ctx.beginPath()
    ctx.arc(10+barHeight/2, barY+barHeight/2, barHeight/2, Math.PI/2, Math.PI*3/2)
    ctx.arc(width-10-barHeight/2, barY+barHeight/2, barHeight/2, Math.PI*3/2, Math.PI/2, false)
    ctx.lineTo(10+barHeight/2, barY+barHeight)
    ctx.clip()
    
    // Progress bar background
    ctx.fillStyle = '#9a5fbb50'
    ctx.fillRect(10, barY, width-20, barHeight)

    // Progress bar fill
    let fillGradient = ctx.createLinearGradient(0, 0, width, 0)
    fillGradient.addColorStop(0, '#8242c4')
    fillGradient.addColorStop(1, '#ce79e1')
    ctx.fillStyle = fillGradient
    ctx.fillRect(10, barY, pointsFrom / (pointsFrom+pointsTo) * (width-20), barHeight)

    // Outline border
    let borderGradient = ctx.createLinearGradient(0, 0, width, 0)
    borderGradient.addColorStop(0, '#ad79e1')
    borderGradient.addColorStop(1, '#e3beec')
    ctx.strokeStyle = borderGradient
    ctx.lineWidth = 5
    ctx.stroke()
    
    ctx.closePath()

    return canvas.toBuffer()
}