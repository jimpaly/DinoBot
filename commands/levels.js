const Tools = require('../tools')
const Data = require('../data');

// IDEA: Get money from daily and use it to buy rep to give, lower cooldowns, or increase luck

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
				if(args.length == 0) return showStat(message.channel, Tools.getAuthor(message))
                const stat = getStatName(args[0].toLowerCase())
                if(stat === undefined) {
                    Tools.findMember(message, args[0]).then((member) => {
                        if(member !== undefined) showStat(message.channel, member)
                        else Tools.fault(message.channel, `I can't seem to find a person named ${args[0]}!`)
                    })
                } else if(args.length == 1) {
                    showStat(message.channel, Tools.getAuthor(message), stat)
                } else {
                    Tools.findMember(message, args[1]).then((member) => {
                        if(member !== undefined) showStat(message.channel, member, stat)
                        else Tools.fault(message.channel, `I can't seem to find a person named ${args[1]}!`)
                    });
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
				['level <member>', `Show someone's levels`]
			],
			public: true,
			developer: false,
			guildOnly: false,
			execute(message, args) {
				if(args.length === 0) {
                    showStat(message.channel, Tools.getAuthor(message), 'points')
                } else {
                    Tools.findMember(message, args[0]).then((member) => {
                        if(member !== undefined) showStat(message.channel, member, 'points')
                        else Tools.fault(message.channel, `I can't seem to find a person named ${args[0]}!`)
                    });
                }
			}
		}, {
            name: 'Reputation',
            alias: ['rep', 'reputation'],
            description: `Give rep to others to show your appreciation!`,
            usage: [
                ['rep', `Check how much time you have left until you can give rep again`],
                ['rep <member>', `Give a rep point to someone else`],
            ],
            public: true,
            developer: false,
            guildOnly: false,
            execute(message, args) {
                if(args.length == 0 || message.channel.type !== 'text') {
                    message.channel.send({embed: Data.replaceEmbed({
                        title: `Rep Status of ${Tools.getName(Tools.getAuthor(message))}`,
                        description: `**Your rep: {member.${message.author.id}.rep}**`,
                        fields: [{
                            name: 'Next rep in...',
                            value: `{member.${message.author.id}.rep.cooldown}`,
                            inline: true
                        }, {
                            name: 'Last given to...',
                            value: `{member.${message.author.id}.latest.repTo}`,
                            inline: true
                        }, {
                            name: 'Last recieved from...',
                            value: `{member.${message.author.id}.latest.repFrom}`,
                            inline: true
                        }]
                    })})
                } else {
                    Tools.findMember(message, args[0]).then((member) => {
                        if(Data.get(`member.${message.author.id}.latest.rep`) + Data.get('level.rep.cooldown')*60000 > Date.now()) {
                            Tools.fault(message.channel, `Please wait {member.${message.author.id}.rep.cooldown} until you can give rep again!`)
                        } else if(member === undefined) {
                            Tools.fault(message.channel, `I can't seem to find a person named ${args[0]}!`)
                        } else if(Data.get(`member.${message.author.id}.rep`) <= 0) {
                            Tools.fault(message.channel, `You don't have any rep left to give!`)
                        } else if(member.id === Data.get(`member.${message.author.id}.latest.repTo`)) {
                            Tools.fault(message.channel, `You can't give rep to the same person twice in a row! Try someone else!`)
                        } else if(member.id === Data.get(`member.${message.author.id}.latest.repFrom`)) {
                            Tools.fault(message.channel, `Why are you giving the rep back to the person who gave it to you? Try someone else!`)
                        } else if(member.id === message.author.id) {
                            Tools.fault(message.channel, `You can't give rep to yourself!`)
                        } else {
                            let give = Data.get('level.rep.give')
                            let recieve = Data.get('level.rep.recieve')
                            Data.set(`member.${message.author.id}.rep.add`, { given: 1 }, false)
                            Data.set(`member.${member.id}.rep.add`, { recieved: 1 }, false)
                            Data.set(`member.${message.author.id}.points.add`, give, false)
                            Data.set(`member.${member.id}.points.add`, recieve, false)
                            Data.set(`member.${message.author.id}.latest.repTo`, member.id, false)
                            Data.set(`member.${member.id}.latest.repFrom`, message.author.id, false)
                            Data.log(`<@!${member.id}> got ${recieve} points from recieving a rep from <@!${message.author.id}>, who got ${give} points for their kindness!`, member.id)
                            Data.set(`member.${message.author.id}.latest.rep`, Date.now())
                            message.channel.send({embed: Data.replaceEmbed({
                                title: 'Rep Given!',
                                description: `Given to ${Tools.getName(member)}
                                            You now have {member.${message.author.id}.rep} rep left`
                            })})
                        }
                    });
                }

                // TODO: Can't give rep to the person who gave it to you and the person you just gave it to
            }
        }, {
            name: 'Invites',
            alias: ['invites', 'invite'],
            description: `Show your invite stats!
                            \`joined\` consists of everyone you have ever invited
                            \`now\`/\`current\` is everyone that is currently in the server
                            \`stayed\` is everyone that has never left the server`,
            usage: [
                ['invites', `Get the active invite links you have`],
                ['invites <member>', `Show someone else's invite links`],
                ['invites joined|now|stayed', `List the people you've invited`],
                ['invites joined|now|stayed <member>', `Show someone else's invites`],
            ],
            public: true,
            developer: false,
            guildOnly: false,
            execute(message, args) {
                if(args.length == 0) return listInviteLinks(message.channel, Tools.getAuthor(message))
                const category = getInviteCategoryName(args[0].toLowerCase())
                if(category === undefined) {
                    Tools.findMember(message, args[0]).then((member) => {
                        if(member !== undefined) listInviteLinks(message.channel, member)
                        else Tools.fault(message.channel, `I can't seem to find a person named ${args[0]}!`)
                    });
                } else if(args.length == 1) {
                    listInvites(message.channel, Tools.getAuthor(message), category)
                } else {
                    Tools.findMember(message, args[1]).then((member) => {
                        if(member !== undefined) listInvites(message.channel, member, category)
                        else Tools.fault(message.channel, `I can't seem to find a person named ${args[1]}!`)
                    });
                }
            }
        }, {
            name: 'Leaderboard',
            alias: ['leaderboard', 'lb', 'rank', 'ranks', 'ranking'],
            description: `List everybody's levels
                    Categories include: \`level\`, \`messages\`, \`voice\`, \`rep\`, \`bumps\`, \`counting\`, and \`invite\`
                    Time periods include: \`allTime\` \`daily\`, \`weekly\`, \`monthly\`, and \`annual\``,
            usage: [
                ['leaderboard <category>', `Show top members in a certain category (See above description)`],
                ['leaderboard <category> <time period>', `Show resetting leaderboards for a certain time period (See above description)`],
            ],
            public: true,
            developer: false,
            guildOnly: false,
            execute(message, args) {

                let stat, time, option
                for(const arg of args) {
                    stat = stat ?? getStatName(arg.toLowerCase())
                    time = time ?? getTimePeriodName(arg.toLowerCase())
                    if(stat === 'invite') option = option ?? getInviteCategoryName(arg.toLowerCase())
                    else if(stat === 'rep') option = option ?? getRepCategoryName(arg.toLowerCase())
                }
                stat = stat ?? 'points'
                time = time ?? 'monthly'
                showLeaderboard(message.channel, Tools.getAuthor(message), stat, time, option)
            }
        }, {
            name: 'Daily Streaks',
            alias: ['daily', 'reward', 'rewards', 'streak', 'streaks'],
            description: `Earn daily rewards! Resets ever day at 0:00 (You can set it to follow your timezone with \`{prefix}timezone\`)`,
            usage: [
                ['daily', `Obtain your daily reward!`],
                ['daily leaderboard', 'Show a leaderboard of the highest daily streaks!']
            ],
            public: true,
            developer: false,
            guildOnly: true,
            execute(message, args) {
                if(['leaderboard', 'lb', 'rank', 'ranks', 'ranking'].includes(args[0])) {
                    message.channel.send('blop')
                } else {
                    let cooldown = Data.get(`member.${message.author.id}.daily.cooldown`)
                    let embed = {
                        description: '',
                        thumbnail: {url: Tools.getAvatar(message.author)},
                        fields: [{
                            name: 'Next reward in...',
                            value: `{member.${message.author.id}.daily.cooldown}`,
                            inline: true
                        }, {
                            name: 'Current Streak',
                            value: `{member.${message.author.id}.daily.current}`,
                            inline: true
                        }, {
                            name: 'Highest Streak...',
                            value: `{member.${message.author.id}.daily.highest}`,
                            inline: true
                        }]
                    }
                    let streak = Data.get(`member.${message.author.id}.daily.current`)
                    if(cooldown < 0) {
                        if(streak > 0 && cooldown < -86400000) {
                            Data.set(`member.${message.author.id}.daily`, 1, false)
                            embed.description += Data.replace(`Oh no, you lost your streak at ${streak}!`)
                            streak = 0
                        } else {
                            Data.set(`member.${message.author.id}.daily.add`, 1, false)
                        }
                        Data.set(`member.${message.author.id}.latest.daily`, Date.now(), false)
                        embed.title = `Daily Reward Recieved, ${Tools.getName(Tools.getAuthor(message))}!`
                        let gain = Data.get(`level.daily.${streak%7}`)
                        if(streak%7 < 6) {
                            Data.set(`member.${message.author.id}.points.add`, gain, false)
                            embed.description += Data.replace(`\nGained ${gain} point${gain == 1 ? '' : 's'}!`)
                            Data.log(`<@!${message.author.id}> got ${gain} points for their daily reward!`, message.author.id)
                        } else {
                            Data.set(`member.${message.author.id}.rep.add`, { recieved: gain }, false)
                            embed.description += Data.replace(`\nGained ${gain} rep!`)
                            Data.log(`<@!${message.author.id}> got ${gain} rep for their daily reward!`, message.author.id)
                        }
                    } else {
                        embed.title = `Your Daily Reward Isn't Ready Yet, ${Tools.getName(Tools.getAuthor(message))}!`
                    }
                    message.channel.send({embed: Data.replaceEmbed(embed)})
                }
            }
        }, {
            name: 'Leveling Configuration',
            alias: ['levelconfig', 'lvlconfig', 'levelsettings', 'lvlsettings'],
            description: `Set different leveling settings (cooldowns are in minutes)`,
            usage: [
                ['levelConfig log <#channel>', `Set the channel used for logging and posting the live leaderboard`],
                ['levelConfig levels <level> <points>', `Configure how much points it takes to get to a certain level`],
                ['levelConfig show|list', `Show all leveling settings`],
                ['levelConfig channel (enable|disable) [#channel]|(all)', 'Set channels members can gain points in'],
                ['levelConfig message|voice [min points] [max points] [cooldown]', 'Set points gained from text messaging or spending time in vc'],
                ['levelConfig daily <day> <points>', 'Set the daily rewards. <day> is a number from 1 to 7. Every 7 days, rep will be rewarded in place of points'],
                ['levelConfig rep [give points] [recieve points] [cooldown]', 'Set points gained from giving or recieving rep'],
                ['levelConfig bump|counting|invite [points]', 'Set points gained'],
            ],
            public: false,
            developer: false,
            guildOnly: true,
            execute(message, args) {
                if(['log', 'logging'].includes(args[0])) {
                    if(message.mentions.channels.size > 0) Data.set('level.channel', message.mentions.channels.first().id)
                    message.channel.send(Data.replace('Logging channel set to: {level.channel}'))
                } else if(['show', 'list', 'all', 'settings'].includes(args[0])) {
                    message.channel.send({embed: Data.replaceEmbed({
                        title: 'Leveling Settings',
                        description: `
                        **Messaging:** {level.messaging} every {level.messaging.cooldown} sending messages
                        **Voice:** {level.voice} every {level.voice.cooldown} in a voice chat with another human
                        **Rep:** give: {level.rep.give}, recieve: {level.rep.recieve}, {level.rep.cooldown}
                        **Bump:** {level.bump} for each Disboard bump through the command
                        **Counting:** {level.counting} for each correct count in {counting}
                        **Invite:** {level.invite} for each invite (points removed if invite leaves)`
                    })})
                } else if(['levels', 'level', 'points'].includes(args[0])) {
                    if(Tools.isNumber(args[1]) && parseInt(args[1]) < 200) {
                        let oldLevels = Tools.clone(Data.get('level.levels'))
                        args.slice(2).forEach((arg, idx) => { if(Tools.isNumber(arg)) {
                            Data.set(`level.levels.${Math.max(0, Math.min(200, parseInt(args[1])+idx-1))}`, parseInt(arg), false)
                        }})
                        Data.get('level.members').forEach((member) => {
                            let points = Data.get(`member.${member}.points`)
                            let level = Tools.getLevel(oldLevels, points)
                            Data.set(`member.${member}.points`, Data.get(`level.levels.${level}`)+points-(oldLevels[level-1] ?? 0), false)
                        })
                        Data.save('Leveling')
                    }
                    message.channel.send(Data.get('level.levels').map((points, level) => `\`${level+1}-${points}\``).join(' | ') || ';-;')
                } else if(['channel', 'channels'].includes(args[0])) {
                    let status
                    if(['enable', 'on'].includes(args[1])) {
                        if(['all'].includes(args[2])) {
                            Data.set(`level.channel.all`, true)
                        } else if(message.mentions.channels.size > 0) {
                            Data.set(`level.channel.${message.mentions.channels.first().id}`, true)
                        } else if(message.guild.channels.cache.has(args[2])) {
                            Data.set(`level.channel.${args[2]}`, true)
                        } else {
                            return Tools.fault(message.channel, `I couldn't find that channel!`)
                        }
                    } else if(['disable', 'off'].includes(args[1])) {
                        if(['all'].includes(args[2])) {
                            message.guild.channels.cache.array().
                                filter((channel) => ['text', 'news', 'voice'].includes(channel.type)).
                                forEach((channel) => Data.set(`level.channel.${channel.id}`, false, false))
                            Data.save('Leveling')
                        } else if(message.mentions.channels.size > 0) {
                            Data.set(`level.channel.${message.mentions.channels.first().id}`, false)
                        } else if(message.guild.channels.cache.has(args[2])) {
                            Data.set(`level.channel.${args[2]}`, false)
                        } else {
                            return Tools.fault(message.channel, `I couldn't find that channel!`)
                        }
                    }
                    let channels = message.guild.channels.cache.array().sort((a, b) => a.position - b.position)
                    message.channel.send({embed: Data.replaceEmbed({
                        title: 'Leveling Enabled Channels',
                        description: channels.filter((channel) => ['text', 'news', 'voice'].includes(channel.type) && channel.parent === null).map((channel) => {
                            if(['text', 'news'].includes(channel.type)) {
                                return `${Data.get(`level.channel.${channel.id}`) ? '🟢' : '🔴'} <#${channel.id}>`
                            } else {
                                return `${Data.get(`level.channel.${channel.id}`) ? '🟢' : '🔴'} 🔊${channel.name}`
                            }
                        }).join('\n'),
                        fields: channels.filter((channel) => channel.type === 'category').map((channel) => { return {
                            name: `${channel.name}`,
                            inline: true,
                            value: channel.children.array().sort((a, b) => a.position - b.position).
                                filter((channel) => ['text', 'news', 'voice'].includes(channel.type)).map((channel) => {
                                if(['text', 'news'].includes(channel.type)) {
                                    return `${Data.get(`level.channel.${channel.id}`) ? '🟢' : '🔴'} <#${channel.id}>`
                                } else {
                                    return `${Data.get(`level.channel.${channel.id}`) ? '🟢' : '🔴'} 🔊${channel.name}`
                                }
                            }).join('\n')
                        }})
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
                } else if(['daily', 'reward', 'rewards', 'streak', 'streaks'].includes(args[0])) {
                    if(Tools.isNumber(args[1]) && Tools.isNumber(args[2])) Data.set(`level.daily.${Math.max(0, Math.min(6, args[1]-1))}`, parseInt(args[2]))
                    message.channel.send(Data.replace('Daily Rewards set to: {level.daily}'))
                } else if(['rep', 'reputation', 'reps'].includes(args[0])) {
                    if(Tools.isNumber(args[1])) Data.set('level.rep.give', parseInt(args[1]))
                    if(Tools.isNumber(args[2])) Data.set('level.rep.recieve', parseInt(args[2]))
                    if(Tools.isNumber(args[3])) Data.set('level.rep.cooldown', parseInt(args[3]))
                    message.channel.send(Data.replace('Rep settings set to: give: {level.rep.give}, recieve: {level.rep.recieve}, {level.rep.cooldown}'))
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
        }, {
            name: 'Leveling Moderation',
            alias: ['levelmod', 'lvlmod'],
            description: `Set leveling stats for different people. 
                        All categories except for invites can be set`,
            usage: [
                ['levelMod set <category> <time period> <member> <amount>', `Set the stat of a person (can't set rep)`],
                ['levelMod add <category> <member> <amount>', `Add to a person's stat for all time periods`],
                ['levelMod remove <category> <member> <amount>', `Remove from a person's stat for all time periods`],
            ],
            public: false,
            developer: false,
            guildOnly: true,
            async execute(message, args) {
                let stat, time, member, amount
                for(const arg of args.slice(1)) {
                    const s = getStatName(arg.toLowerCase())
                    if(s !== undefined && stat === undefined) { stat = s; continue }
                    const  t = getTimePeriodName(arg.toLowerCase())
                    if(t !== undefined && time === undefined) { time = t; continue }
                    if(Tools.isNumber(arg) && amount === undefined) { amount = parseInt(arg); continue }
                    if(member === undefined) member = (await Tools.findMember(message, arg))?.id
                }
                stat = stat ?? 'points'
                time = time ?? 'allTime'
                if(amount === undefined) return Tools.fault(message.channel, `I need an amount to set!`)
                if(member === undefined) return Tools.fault(message.channel, `I couldn't find the person!`)
                const before = Data.get(`member.${member}.${stat}.${time}`)
                if(['set', 'edit'].includes(args[0])) {
                    if(['invite', 'rep'].includes(stat)) return Tools.fault(message.channel, `I can't set that stat!`)
                    Data.set(`member.${member}.${stat}.${time}`, amount)
                } else if(['add', 'plus', 'give'].includes(args[0])) {
                    if(stat === 'invite') return Tools.fault(message.channel, `I can't add to invites!`)
                    Data.set(`member.${member}.${stat}.add`, amount)
                    time = undefined
                } else if(['remove', 'minus', 'take'].includes(args[0])) {
                    if(stat === 'invite') return Tools.fault(message.channel, `I can't remove from invites!`)
                    Data.set(`member.${member}.${stat}.add`, -amount)
                    time = undefined
                }
                Tools.success(message.channel, `${time ? time+' ' : ''}${stat} of <@!${member}> set from ${before} to {member.${member}.${stat}${time ? '.'+time : ''}}`)
            }
        }
	],
    level(message) {

		if(message.member == null) return

        // check bump
        if(message.author.id === '302050872383242240') {
            bump = (message.embeds[0] ?? {}).description
            if(bump !== undefined && bump.includes('Bump done')) {
                let member = bump.slice(2, 20)
                Data.set(`member.${member}.bumps.add`, 1, false)
                Data.set(`member.${member}.points.add`, Data.get('level.bump'), false)
                Data.log(`<@!${member}> got ${Data.get(`level.bump`)} points bumping the server!`, member)
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
            voiceLeave(oldState.channel, oldState.member)
        } else if(newState.channel !== null && oldState.channel !== null) {
            if(newState.channel.id !== oldState.channel.id) {   // Switching channels
                voiceJoin(newState.channel)
                voiceLeave(oldState.channel, oldState.member)
            } else if(!newState.deaf && oldState.deaf) {    // Undeafening
                voiceJoin(newState.channel)
            } else if(newState.deaf && !oldState.deaf) {    // Deafening
                voiceLeave(oldState.channel, oldState.member)
            }
        }
    },
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
    let embed = {
        title: (['Levels', 'Messaging Stats', 'Voice Chat Stats', 'Reputation', 'Disboard Bumps', 'Counting Game Stats',
            'Invite Stats'][['points', 'messages', 'voice', 'rep', 'bumps', 'counting', 'invite'].indexOf(stat)] ?? '') +
            ` of ${Tools.getName(member)}`,
        thumbnail: { url: Tools.getAvatar(member) },
        fields: []
    }
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
async function showLeaderboard(channel, member, stat, time, option) { // TODO: Add daily steaks
    const message = await channel.send('Loading leaderboard...')
    let leaderboard = Data.get(`level.leaderboard.${member.id}.${stat}.${time}.${option}`)
    let embed = {
        title: (['Daily', 'Weekly', 'Monthly', 'Annual'][['daily', 'weekly', 'monthly', 'annual'].indexOf(time)] ?? '') +
                ' ' + (['Leveling', 'Messaging', 'Voice Chat', 'Reputation', 'Disboard Bumping', 'Counting Game', 'Invite']
                [['points', 'messages', 'voice', 'rep', 'bumps', 'counting', 'invite'].indexOf(stat)] ?? '') +
                ' Leaderboard',
        description: `${stat === 'rep' ?
                option === 'given' ? 'Now viewing the amount of given reps' :
                option === 'recieved' ? 'Now viewing the amount of recieved reps' :
                `Hint: to view the given and recieved reps individually,
                try \`{prefix}leaderboard rep given|recieved ${time}\`` :
            stat === 'invite' ?
                option === 'current' ? `Now only counting invites currently in the server` :
                option === 'stayed' ? 'Now only counting invites who never left' :
                `Hint: to not count invites who aren't in the server,
                try \`{prefix}leaderboard invite current|stayed ${time}\`` : ''}
            **${leaderboard[0]}**
            ——————————`,
        timestamp: Date.now()
    }
    Tools.pageList(message, -1, 10, leaderboard.slice(1), embed)
}

async function listInvites(channel, member, category) {
    let message = await channel.send('Loading people...')
    let invites = Data.get(`member.${member.id}.invite.joined`)
    if(category !== 'joined') invites = Tools.removeElements(invites, ...Data.get(`member.${member.id}.invite.left`))
    if(category === 'stayed') invites = Tools.removeElements(invites, ...Data.get(`member.${member.id}.invite.returned`))
    Tools.pageList(message, -1, 10, invites.map((invite) => `<@!${invite}>`), {
        title: (category === 'joined' ? 'All' :
                category === 'current' ? 'Currently Present' :
                'Always Stayed') + ` Invites of ${Tools.getName(member)}`,
        description: invites.length == 0 ? 'no invites ;-;' : '',
        thumbnail: { url: Tools.getAvatar(member) }
    })
}
//TODO: add channel
async function listInviteLinks(channel, member) {
    let message = await channel.send('Loading invites...')
    let invites = await Tools.getInviteLinks(member)
    Tools.pageList(message, -1, 10, invites.map((invite) => {
        let str = `\`${Tools.align(invite.code, 8, 'left')}\``
        str += `([link](https://discord.gg/${invite.code}))`
        str += ` | uses: \`${Tools.align(`${invite.uses}/${invite.max || '∞'}`, 4, 'left')}\``
        str += ` | expires: \`${Tools.align(invite.expire ? Tools.durationToStr(invite.expire - Date.now()) : 'never', 6, 'left')}\``
        return str
    }), {
        title: `Invite links of ${Tools.getName(member)}`,
        description: invites.length == 0 ? 'no invites ;-;' : '',
        thumbnail: { url: Tools.getAvatar(member) }
    })
}

function getStatName(alias) {
    if(['level', 'levels', 'leveling', 'lvl', 'points', 'point', 'pts', 'score', 'scores'].includes(alias)) return 'points'
    if(['messages', 'message', 'text', 'texting', 'messaging', 'texts'].includes(alias)) return 'messages'
    if(['voice', 'vc', 'talk', 'talking', 'chat', 'chatting'].includes(alias)) return 'voice'
    if(['rep', 'reputation', 'reps'].includes(alias)) return 'rep'
    if(['bumps', 'bump', 'disboard'].includes(alias)) return 'bumps'
    if(['counting', 'count', 'cnt', 'counts'].includes(alias)) return 'counting'
    if(['invite', 'invites'].includes(alias)) return 'invite'
}
function getTimePeriodName(alias) {
    if(['alltime', 'all'].includes(alias)) return 'allTime'
    if(['daily', 'today', 'day'].includes(alias)) return 'daily'
    if(['weekly', 'week'].includes(alias)) return 'weekly'
    if(['monthly', 'month'].includes(alias)) return 'monthly'
    if(['annual', 'annually', 'year', 'yearly'].includes(alias)) return 'annual'
}
function getInviteCategoryName(alias) {
    if(['joined', 'list', 'lst'].includes(alias)) return 'joined'
    if(['current', 'now', 'here', 'present'].includes(alias)) return 'current'
    if(['stayed', 'stay', 'staying'].includes(alias)) return 'stayed'
    // if(['left', 'leave', 'kicked', 'banned'].includes(alias)) return 'left'
    // if(['returned', 'return'].includes(alias)) return 'returned'
}
function getRepCategoryName(alias) {
    if(['given', 'gave', 'give', 'gived'].includes(alias)) return 'given'
    if(['recieved', 'recieve', 'take', 'got', 'get', 'earn', 'earned'].includes(alias)) return 'recieved'
}

/*

"template": {
    "lastUpdate": 0,
    "latest": {
        "points": 0,
        "voice": 0,
        "daily": 0,
        "rep": 0,
        "repTo": "",
        "repFrom": ""
    },
    "streak": {
        "highest": 0,
        "current": 0
    }
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
