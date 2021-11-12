import { createCommand } from '../../bot-framework'

module.exports = createCommand<{}>({
    name: 'convert',
    description: 'convert json files to mongodb',
    permission: 'owner',
    disabled: true,
    args: {},
    async execute() {
        return 'command is disabled';
        // const stats = (await Obj.readJSON('../data/levels.json')).stats
        // const oldTypes = ['points', 'messages', 'voice', 'streak', 'rep', 'invite', 'bumps', 'counting']
        // for(const id in stats) {
        //     let user = await Stats.get(id)
        //     for(const stat of Stats.statTypes as Stats.StatType[]) {
        //         const oldStat = oldTypes[Stats.statTypes.indexOf(stat)]
        //         for(const time of Stats.timePeriods) {
        //             if(time === 'alltime') continue
        //             if(stat === 'daily') {
        //                 user[stat][time].current = stats[id].streak?.current || 0
        //                 user[stat][time].highest = stats[id].streak?.highest || 0
        //                 user[stat][time].total = stats[id].streak?.current || 0
        //             } else if(stat === 'reps') {
        //                 user[stat][time].given = stats[id][time][oldStat]?.joined || 0
        //                 user[stat][time].received = stats[id][time][oldStat]?.recieved || 0
        //             } else if(stat === 'invites') {
        //                 user[stat][time].joins = stats[id][time][oldStat]?.joined || 0
        //                 user[stat][time].leaves = stats[id][time][oldStat]?.left || 0
        //                 user[stat][time].returns = stats[id][time][oldStat]?.returned || 0
        //             } else {
        //                 user[stat][time] = stats[id][time][oldStat] || 0
        //             }
        //         }
        //         if(stat === 'daily') {
        //             user[stat].current = stats[id].streak?.current || 0
        //             user[stat].highest = stats[id].streak?.highest || 0
        //             user[stat].total = stats[id].streak?.current || 0
        //         } else if(stat === 'reps') {
        //             user[stat].given = stats[id].allTime[oldStat]?.joined || 0
        //             user[stat].received = stats[id].allTime[oldStat]?.recieved || 0
        //             user[stat].stored = user[stat].received - user[stat].given || 0
        //             user[stat].lastReceiver = stats[id].latest?.repTo || ''
        //             user[stat].lastGiver = stats[id].latest?.repFrom || ''
        //         } else if(stat === 'invites') {
        //             user[stat].joins = stats[id].allTime[oldStat]?.joined || []
        //             user[stat].leaves = stats[id].allTime[oldStat]?.left || []
        //             user[stat].returns = stats[id].allTime[oldStat]?.returned || []
        //         } else {
        //             user[stat].alltime = stats[id].allTime[oldStat] || 0
        //         }
        //     }
        //     user.daily.total = stats[id].streak?.current || 0
        //     user.daily.current = stats[id].streak?.current || 0
        //     user.daily.highest = stats[id].streak?.current || 0
        //     user.lastReset = new Date(stats[id].lastUpdate || 0)
        //     user.save()
        // }
        // const profiles = (await Obj.readJSON('../data/profiles.json')).profiles
        // for(const id in profiles) {
        //     let profile = await Profiles.get(id)
        //     profile.timezone = profiles[id].timezone || '+0'
        //     if(profiles[id].joined?.first) profile.joins.push({
        //         date: new Date(profiles[id].joined.first),
        //         inviter: profiles[id].joined.firstInvite ?? null
        //     })
        //     if(profiles[id].joined?.last) profile.joins.push({
        //         date: new Date(profiles[id].joined.last),
        //         inviter: profiles[id].joined.lastInvite ?? null
        //     })
        //     profile.bot = profiles[id].bot ?? false
        //     profile.save()
        // }
        // return message.say('done!')
    },
})