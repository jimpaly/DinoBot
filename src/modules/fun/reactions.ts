import { oneLine } from 'common-tags'
import { createCommand } from '../../bot-framework'

module.exports = createCommand<{
	option?: 'enable' | 'disable'
}>({
	name: 'reactions',
	description: 'update your reaction preferences',
	details: oneLine`
	Sometimes I will react to messages you send! 
	You can use this command to enable or disable that ;-;
	`,
	aliases: ['reaction', 'react', 'text', 'txt'],
	type: 'both',
	args: {
		option: {
			description: 'Enable or disable reactions',
			type: 'string',
			optional: true,
			choices: {
				enable: ['enable', 'on', 'yes', 'true'],
				disable: ['disable', 'off', 'no', 'false'],
			}
		},
	},
	execute({option}, _, {user}) {
		const i = global.config.reactionDisabledMembers.indexOf(user.id)
		if(option === 'enable' && i != -1) {
			global.config.reactionDisabledMembers.splice(i, 1)
			global.config.save()
		} else if(option === 'disable' && i == -1) {
			global.config.reactionDisabledMembers.push(user.id)
			global.config.save()
		}
		return {embeds: [{
			title: 'Reaction Preference of {member.name}',
			description: `${!global.config.reactionDisabledMembers.includes(user.id)}`, //`{member.reactions}!`,
			//thumbnail: { url: '{member.avatar}' }
		}]}
	}
})