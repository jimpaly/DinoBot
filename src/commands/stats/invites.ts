import { oneLine, stripIndents } from 'common-tags'
import { CommandoClient, Command, CommandoMessage } from "discord.js-commando"
import { Stats } from '../../database'
import { Tools, Discord, Time } from '../../tools'

module.exports = class InvitesCommand extends Command {

    constructor(client: CommandoClient) {
        super(client, {
            name: 'invites',
            aliases: ['invite', 'inviting', 'inviter'],
            group: 'stats',
            memberName: 'invites',
            description: 'Invites',
            details: stripIndents`
                Show your invite stats!
                \`<category>\` can be one of the following:
                \`joined\` consists of everyone you have ever invited
                \`here\` is everyone that is currently in the server
                \`stayed\` is everyone that has never left the server
            `,
			examples: [
				"`{prefix}invites` Get the active invite links you have",
				"`{prefix}invites <category>` List the people you've invited for a specific category",
				"`{prefix}invites <category> <member>` Show someone else's invites",
			],
            args: [{
                key: 'category',
                prompt: 'Which category do you want to show? (`joined`,`here`,`stayed`)',
                type: 'string',
                default: '',
                validate: (arg: string) => Stats.resolveInviteDisplayType(arg) !== null,
                parse: Stats.resolveInviteDisplayType,
                error: oneLine`That isn't a valid category! It should be 
                    one of these: ${'`joined`, `left`, `here`, `stayed`'}`
            }, {
                key: 'member',
                prompt: 'Which member do you want to show the invites of?',
                type: 'member',
                default: '',
                error: `I can't seem to find that member!`
            }]
        })
    }

    onError = (err: Error, message: CommandoMessage) => Discord.error(message, err)

    async run(message: CommandoMessage, { category, member }: 
        { category: Stats.InviteDisplayType | '', member: Discord.User }) {
        if(!member) member = message.member ?? message.author 

        if(!category) { // If no category is mentioned, list invite links

            let list = await message.say('Loading links...')
            let invites = (await Discord.guild.fetchInvites())
                .filter(({inviter}) => inviter?.id === member.id)
                .map(invite => { return {
                    code: invite.code,
                    uses: invite.uses || 0,
                    max: invite.maxUses,
                    expire: invite.expiresTimestamp,
                }})
            return Discord.page(list, Math.ceil(invites.length/10), page => Discord.embed({
                title: `Invite Links of {member.name}`,
                thumbnail: { url: '{member.avatar}' },
                description: invites.length > 0 ? invites.slice((page-1)*10, page*10)
                .map(invite => oneLine`
                    \`${Tools.align(invite.code, 8, 'left')}\` |
                    uses: \`${Tools.align(`${invite.uses}/${invite.max || '∞'}`, 4, 'left')}\` |
                    expires: \`${Tools.align(invite.expire ? 
                        Time.durationToStr(invite.expire - Date.now()) : 
                        'never', 6, 'left')}\`
                `).join('\n') : ';-; no invites',
            }, {message}))

        } else {

            let list = await message.say('Loading invites...')
            const inviteStats = (await Stats.get(member.id)).invites

            let invites: string[] = []  // Get the specific category of invites
            if(category === 'joined') invites = inviteStats.joins
            else if(category === 'left') invites = inviteStats.leaves
            else if(category === 'here') invites = inviteStats.joins.filter(invite => 
                !inviteStats.leaves.includes(invite))
            else if(category === 'stayed') invites = inviteStats.joins.filter(invite =>  
                !inviteStats.leaves.includes(invite) && !inviteStats.returns.includes(invite))
                Stats.inviteDisplayTypes
            return Discord.page(list, Math.ceil(invites.length/10), page => Discord.embed({
                title: `${['All', 'Left', 'Currently Present', 'Always Stayed']
                    [Stats.inviteDisplayTypes.indexOf(category)]} Invites of {member.name}`,
                thumbnail: { url: '{member.avatar}' },
                description: invites.length > 0 ? invites.slice((page-1)*10, page*10)
                    .map(invite => `<@!${invite}>`).join('\n') : ';-; no invites',
            }, { member }))

        }
    }
}