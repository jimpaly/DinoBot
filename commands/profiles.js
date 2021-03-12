const Tools = require('../tools')
const Data = require('../data');

module.exports = {
	name: 'Profiles',
	description: 'Create a profile to introduce yourself!',
	commands: [
		{
			name: 'Profile',
			alias: ['profile', 'p', 'pf'],
			description: `Show your profile card and update your info!`,
			usage: [
				['profile', `Display your own profile card`],
				['profile (member) <member>', `Show someone's profile card`],
                ['profile set <component> <value>', 'Customize your profile card (refer to below command for more)'],
                ['profile components|set', 'Get to know the components more!']
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {
                message.channel.send('bloop')
			}
		}
    ],
    addMember(member, inviter) {

        // Invite stat in leveling
        for(const otherInviter of Data.get('level.members')) {
            if(otherInviter === inviter) continue
            if(Data.get(`member.${otherInviter}.invite.left`).includes(member.id)) {
                Data.set(`member.${otherInviter}.invite.left.remove`, member.id, false)
                Data.set(`member.${otherInviter}.invite.returned.add`, member.id, false)
            }
        }
        if(Data.get(`member.${inviter}.invite.left`).includes(member.id)) {
            Data.set(`member.${inviter}.invite.left.remove`, member.id, false)
            Data.set(`member.${inviter}.invite.returned.add`, member.id, false)
        } else {
            Data.set(`member.${inviter}.invite.joined.add`, member.id, false)
        }
        Data.set(`member.${inviter}.points.add`, Data.get(`level.invite`), false)
        Data.save('Leveling')

        Data.set(`member.${member.id}.join`, inviter)
    },
    removeMember(member) {

        for(const inviter of Data.get('level.members')) {
            if(Data.get(`member.${inviter}.invite.returned`).includes(member.id)) {
                Data.set(`member.${inviter}.invite.returned.remove`, member.id, false)
                Data.set(`member.${inviter}.invite.left.add`, member.id, false)
            } else if(Data.get(`member.${inviter}.invite.joined`).includes(member.id)) {
                Data.set(`member.${inviter}.invite.left.add`, member.id, false)
            }
        } Data.save('Leveling')
    }
};


/*

"template": {
    "bio": "",
    "background": "",
    "joined": {
        "first": 0,
        "firstInvite": "",
        "last": 0,
        "lastInvite": ""
    }
}
*/