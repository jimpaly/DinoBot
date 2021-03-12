const Tools = require('../tools')
const Data = require('../data');

module.exports = {
	name: 'Leveling',
	description: 'Get active, gain points, raise your level, and have fun!',
	commands: [
		{
			name: 'Stats',
			alias: ['stats', 'stat', 'detail', 'details'],
			description: `Show the detailed leveling stats of someone
                            Categories include: \`level\`, \`messages\`, \`voice\`, \`rep\`, \`bumps\`, \`counting\`, and \`invite\``,
			usage: [
				['stats', `Show a summary of your stats`],
				['stats <member>', `Show a summary of someone else's stats`],
				['stats <category>', `Show your stats for a specific category (see above description)`],
				['stats <category> <member>', `Show someones else's stats for categories (see above description)`]
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {
				if(args.length == 0) {
                    showStat(message.channel, Tools.getAuthor(message))
                } else if(args.length == 1) {
                    let stat = getStatName(args[0].toLowerCase())
                    if(stat !== undefined) showStat(message.channel, Tools.getAuthor(message), stat)
                    else Tools.findMember(message, args[0]).then((member) => {
                        if(member !== undefined) showStat(message.channel, member)
                        else Tools.fault(message.channel, `${args[0]} isn't a valid stat! Try \`{prefix}help stats\` to learn more`)
                    })
                } else {
                    let stat = getStatName(args[0].toLowerCase())
                    if(stat !== undefined) Tools.findMember(message, args[1]).then((member) => {
                        if(member !== undefined) showStat(message.channel, member, stat)
                        else Tools.fault(message.channel, `I can't seem to find a person named ${args[1]}!`)
                    }); else Tools.fault(message.channel, `${args[0]} isn't a valid stat! Try \`{prefix}help stats\` to learn more`)
                }
			}
		}, {
			name: 'Leveling',
			alias: ['level', 'levels', 'leveling', 'lvl', 'points', 'point', 'pts', 'score', 'scores'],
			description: `Stay active to gain points and level up!
                        There are a bunch of ways to gain levels, including messaging, inviting, voice chatting, and more!
                        Visit {levels.channel} to learn more!`,
			usage: [
				['level', `Show your levels and points`],
				['level <member>', `Show someone's levels`],
                ['level leaderboard|all', `Show top members in points`]
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {
				if(args.length === 0) {
                    showStat(message.channel, message.member, 'points')
                } else if(['leaderboard', 'lb', 'all'].includes(args[0])) {

                } else {
                    Tools.findMember(message, args[0]).then((member) => {
                        if(member !== undefined) showStat(message.channel, member, stat)
                        else Tools.fault(message.channel, `I can't seem to find a person named ${args[0]}!`)
                    });
                }
			}
		}, {
            name: 'Invites',
            alias: ['invites', 'invite'],
            description: `Show your invite stats!`,
            usage: [
                ['invites', `Show your stats`],
                ['invites <@member>', `Show someone else's invite stats`],
                ['invites leaderboard|all', 'Show top members in number of people invited'],
            ],
            public: true,
            developer: false,
            guildOnly: false,
            execute(message, args) {
                message.channel.send('blop')
            }
        }, {
            name: 'Leaderboard',
            alias: ['leaderboard', 'lb', 'rank', 'ranks', 'ranking'],
            description: `List everybody's levels`,
            usage: [
                ['leaderboard (level|points|score)', `Show top members in leveling`],
                ['leaderboard rep|reputation', 'Show top members in reputation points']
                ['leaderboard messages|texting', `Show top members in message count`],
                ['leaderboard voice|talking', 'Show top members in time in voice chats'],
                ['leaderboard invites', 'Show top members in people invited'],
            ],
            public: true,
            developer: false,
            guildOnly: false,
            execute(message, args) {
                message.channel.send('bloop')
            }
        }, {
            name: 'Daily',
            alias: ['daily', 'reward', 'rewards'],
            description: `Earn daily rewards! (resets ever day at 0:00 GMT)`,
            usage: [
                ['daily', `Obtain your daily reward!`]
            ],
            public: true,
            developer: false,
            guildOnly: true,
            execute(message, args) {
                message.channel.send('blop')
            }
        }, {
            name: 'Leveling Configuration',
            alias: ['levelconfig', 'lvlconfig', 'levelsettings', 'lvlsettings'],
            description: `Set different leveling settings (cooldowns are in minutes)`,
            usage: [
                ['levelConfig show|list', `Show all leveling settings`],
                ['levelConfig channel (enable|disable) [#channel]|(all)', 'Set channels to gain points in'],
                ['levelConfig message [min points] [max points] [cooldown]', 'Set points gained from text messaging'],
                ['levelConfig voice [min points] [max points] [cooldown]', 'Set points gained every [cooldown] minutes in vc'],
                ['levelConfig bump [points]', 'Set points gained by bumping with Disboard'],
                ['levelConfig counting [points]', 'Set points gained for each counting in {counting}'],
                ['levelConfig invite [points]', 'Set points gained for inviting someone']
            ],
            public: false,
            developer: false,
            guildOnly: true,
            execute(message, args) {
                if(['show', 'list', 'all', 'settings'].includes(args[0])) {
                    message.channel.send({embed: Data.replaceEmbed({
                        title: 'Leveling Settings',
                        description: `
                        **Messaging:** {level.messaging} every {level.messaging.cooldown} sending messages
                        **Voice:** {level.voice} every {level.voice.cooldown} in a voice chat with another human
                        **Bump:** {level.bump} for each Disboard bump through the command
                        **Counting:** {level.counting} for each correct count in {counting}
                        **Invite:** {level.invite} for each invite (points removed if invite leaves)`
                    })})
                } else if(['message', 'm', 'messaging', 'texting', 'text'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.messaging', { min: parseInt(args[1]) })
                    if(Tools.isNumber(args[2])) Data.set('level.messaging', { max: parseInt(args[2]) })
                    if(Tools.isNumber(args[3])) Data.set('level.messaging.cooldown', parseInt(args[3]))
                    message.channel.send(Data.replace('Messaging settings set to: {level.messaging}, {level.messaging.cooldown}'))
                } else if(['voice', 'vc', 'talk', 'speak', 'talking', 'speaking'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.voice', { min: parseInt(args[1]) })
                    if(Tools.isNumber(args[2])) Data.set('level.voice', { max: parseInt(args[2]) })
                    if(Tools.isNumber(args[3])) Data.set('level.voice.cooldown', parseInt(args[3]))
                    message.channel.send(Data.replace('Voice settings set to: {level.voice}, {level.voice.cooldown}'))
                } else if(['bump', 'bumping', 'disboard'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.bump', parseInt(args[1]))
                    message.channel.send(Data.replace('Bump settings set to: {level.bump}'))
                } else if(['counting', 'count', 'cnt'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.counting', parseInt(args[1]))
                    message.channel.send(Data.replace('Counting settings set to: {level.counting}'))
                } else if(['invite', 'inviting', 'inv'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.invite', parseInt(args[1]))
                    message.channel.send(Data.replace('Invite settings set to: {level.invite}'))
                } else {
                    message.channel.send('blop')
                }
            }
        }, 
	],
    level(message) {

		if(message.member == null) return

        // check bump
        if(message.author.id === '302050872383242240') {
            bump = (message.embeds[0] ?? {}).description
            if(bump !== undefined && bump.includes('Bump done')) {
                Data.set(`member.${bump.slice(2, 20)}.bumps.add`, 1, false)
            }
        }

        let id = message.member.id

        // Points
        if(message.createdTimestamp - Data.get(`member.${id}.latest.points`) > Data.get('level.messaging.cooldown')*60000) {
            Data.set(`member.${message.member.id}.points.add`, Tools.randomRange(Data.get('level.messaging')), false)
            Data.set(`member.${message.member.id}.latest.points`, message.createdTimestamp, false)
        }

        //Messages
        Data.set(`member.${message.member.id}.messages.add`, 1, false)

        Data.save('Leveling')
    },
    voice(oldState, newState) {

        function getJoinedCount(channel) {
            let joinedCount = 0
            for(const member of channel.members.array()) {
                if(member.user.bot) continue
                if(member.voice.channel !== null && !member.voice.deaf) {
                    joinedCount += 1
                }
            }
            return joinedCount
        }
        function voiceJoin(channel) {
            if(getJoinedCount(channel) > 1) {
                for(const member of channel.members.array()) {
                    Data.set(`member.${member.id}.latest.voice`, true, false)
                }
                Data.save('Leveling')
            }
        }
        function voiceLeave(channel, user) {
            if(getJoinedCount(channel) <= 1) {
                for(const member of channel.members.array()) {
                    Data.set(`member.${member.id}.latest.voice`, false, false)
                }
            }
            Data.set(`member.${user.id}.latest.voice`, false)
        }

        if(newState.channel !== null && oldState.channel === null) { // Joining channel
            voiceJoin(newState.channel)
        } else if(newState.channel === null && oldState.channel !== null) { // Leaving channel
            voiceLeave(oldState.channel, newState.member)
        } else if(newState.channel !== null && oldState.channel !== null) {
            if(newState.channel.id !== oldState.channel.id) {   // Switching channels
                voiceJoin(newState.channel)
                voiceLeave(oldState.channel, newState.member)
            } else if(!newState.deaf && oldState.deaf) {    // Undeafening
                voiceJoin(newState.channel)
            } else if(newState.deaf && !oldState.deaf) {    // Deafening
                voiceLeave(oldState.channel, newState.member)
            }
        }
    },
    addInvite(member, inviter) {

    },
    removeInvite(member, inviter) {

    }
};

/**
 * Show the stats of a member
 * @param {Discord.TextChannel} channel The channel to send the stats to
 * @param {Discord.GuildMember} member The member to show stats of
 */
function showStat(channel, member, stat) {
    if(stat === undefined) {
        return channel.send({ embed: Data.replaceEmbed({
            title: `Stats of ${Tools.getName(member)}`,
            thumbnail: { url: Tools.getAvatar(member) },
            fields: [{
                    name: 'Level',
                    value: `**{member.${member.id}.level}**`,
                    inline: true
                }, {
                    name: 'Points',
                    value: `**{member.${member.id}.points}**`,
                    inline: true
                }, {
                    name: 'Messages',
                    value: `**{member.${member.id}.messages}**`,
                    inline: true
                }, {
                    name: 'Voice Chat',
                    value: `**{member.${member.id}.voice}**`,
                    inline: true
                }, {
                    name: 'Reputation',
                    value: `**{member.${member.id}.rep}**`,
                    inline: true
                }, {
                    name: 'Bumps',
                    value: `**{member.${member.id}.bumps}**`,
                    inline: true
                }, {
                    name: 'Counting',
                    value: `**{member.${member.id}.counting}**`,
                    inline: true
                }, {
                    name: 'Invites',
                    value: `**{member.${member.id}.invite}**`,
                    inline: true
                }
            ]
        })})
    }
    let embed = { title: '', fields: [] }
    embed.title = `${stat === 'points' ? 'Levels' :
                    stat === 'messages' ? 'Messaging Stats' :
                    stat === 'voice' ? 'Voice Chat Stats' : 
                    stat === 'rep' ? 'Reputation' :
                    stat === 'bumps' ? 'Disboard Bumps' :
                    stat === 'counting' ? 'Counting Game Stats' :
                    stat === 'invite' ? 'Invite Stats' :
                    'lol pls @ Jimps'} of ${Tools.getName(member)}`
    embed.thumbnail = { url: Tools.getAvatar(member) }
    if(stat === 'points') {
        embed.fields.push({
            name: 'Level',
            value: `**{member.${member.id}.level}**`,
            inline: true
        })
    } else if(stat === 'rep') {
        embed.fields.push({
            name: 'Reputation',
            value: `**{member.${member.id}.rep}**`,
            inline: true
        }, {
            name: 'Lastest',
            value: `Given to {member.${member.id}.latest.repTo}
                    Recieved from {member.${member.id}.latest.repFrom}`,
            inline: true
        })
    }
    embed.fields.push({
        name: 'All Time',
        value: `**{member.${member.id}.${stat}.allTime}**`,
        inline: true
    })
    if(!['rep', 'bumps', 'counting', 'invite'].includes(stat)) {
        embed.fields.push({
            name: 'Daily',
            value: `{member.${member.id}.${stat}.daily}`,
            inline: true
        })
    }
    if(!['invite'].includes(stat)) {
        embed.fields.push({
            name: 'Weekly',
            value: `{member.${member.id}.${stat}.weekly}`,
            inline: true
        })
    }
    embed.fields.push({
        name: 'Monthly',
        value: `{member.${member.id}.${stat}.monthly}`,
        inline: true
    }, {
        name: 'Annual',
        value: `{member.${member.id}.${stat}.annual}`,
        inline: true
    })
    if(stat === 'invite') {
        embed.fields.push({
            name: 'Recent Invites',
            value: `{member.${member.id}.invite.joined.10}`
        })
    }
    channel.send({embed: Data.replaceEmbed(embed)})
}
function listStat(channel, stat) {

}

function getStatName(alias) {
    if(['level', 'levels', 'leveling', 'lvl', 'points', 'point', 'pts', 'score', 'scores'].includes(alias)) {
        return 'points'
    } else if(['messages', 'message', 'text', 'texting', 'messaging', 'texts'].includes(alias)) {
        return 'messages'
    } else if(['voice', 'vc', 'talk', 'talking', 'chat', 'chatting'].includes(alias)) {
        return 'voice'
    } else if(['rep', 'reputation', 'reps'].includes(alias)) {
        return 'rep'
    } else if(['bumps', 'bump', 'disboard'].includes(alias)) {
        return 'bumps'
    } else if(['counting', 'count', 'cnt', 'counts'].includes(alias)) {
        return 'counting'
    } else if(['invite', 'invites'].includes(alias)) {
        return 'invite'
    }
}

/*

"template": {
    "lastUpdate": 0,
    "latest": {
        "points": 0,
        "voice": 0
    },
    "allTime": {
        "points": 0,
        "rep": {
            "given": 0,
            "recieved": 0
        },
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0,
        "invite": []
    },
    "daily": {
        "points": 0,
        "rep": {
            "given": 0,
            "recieved": 0
        },
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0,
        "invite": 0
    },
    "weekly": {
        "points": 0,
        "rep": {
            "given": 0,
            "recieved": 0
        },
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0,
        "invite": 0
    },
    "monthly": {
        "points": 0,
        "rep": {
            "given": 0,
            "recieved": 0
        },
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0,
        "invite": 0
    },
    "annual": {
        "points": 0,
        "rep": {
            "given": 0,
            "recieved": 0
        },
        "money": 0,
        "messages": 0,
        "voice": 0,
        "bumps": 0,
        "counting": 0,
        "invite": 0
    }
}
*/