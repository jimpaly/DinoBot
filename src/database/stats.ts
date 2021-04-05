import { oneLine, stripIndent, stripIndents } from 'common-tags'
import { MessageEmbedOptions, Collection, TextChannel, NewsChannel, Message } from 'discord.js'
import * as Mongoose from 'mongoose'
import { Time, Tools, Obj, Discord } from '../tools'
import config = require('../configuration/stats.json')
import * as Profiles from './profiles'

// let cache = new Collection<string, {
//     user: UserStat,
//     timer: NodeJS.Timeout
// }>()
// const cacheTimeout = 30*Time.min

interface Stat<T> {
    alltime: T,
    daily: T,
    weekly: T,
    monthly: T,
    annual: T,
}
interface Rep {
    given: number,
    received: number,
}
interface Invite<T> {
    joins: T,
    leaves: T,
    returns: T,
}
interface Daily {
    total: number,
    current: number,
    highest: number,
}
export interface UserStat extends Mongoose.Document {
    _id: string
    createdAt: Date
    updatedAt: Date
    lastReset: Date
    points: Stat<number>,
    messages: Stat<number> & {
        lastReward: Date,
    }
    voice: Stat<number> & {
        lastReward: Date, 
        lastUpdate: Date,
        inVoice: boolean,
    }
    daily: Omit<Stat<Daily>, 'alltime'> & Daily & {
        nextReward: Date,
    }
    reps: Omit<Stat<Rep>, 'alltime'> & Rep & {
        stored: number,
        lastGiven: Date,
        lastReceiver: string,
        lastGiver: string,
    }
    invites: Omit<Stat<Invite<number>>, 'alltime'> & Invite<string[]>
    bumps: Stat<number>
    counts: Stat<number>
    getStat(stat: StatType, time: TimePeriod, option?: DailyType | RepsType | InviteDisplayType): number
    resetTimePeriods(): Promise<UserStat>
    addStat(stats: StatType, amount: StatOptions | number): UserStat
    addMessage(): UserStat
    updateVoice(inVoice: boolean): UserStat
    claimDaily(): UserStat
    giveRep(member: string): UserStat
    receiveRep(member: string): UserStat
    addInvite(member: string): UserStat
    removeInvite(member: string): UserStat
    addCount(): UserStat
    removeCount(): UserStat
    addBump(): UserStat
    getLevel(levels?: number): number
    getRepCooldown(): number
    getDailyCooldown(): number
    
}

export type TimePeriod =  'alltime' | 'daily' | 'weekly' | 'monthly' | 'annual'
export const timePeriods: TimePeriod[] = ['alltime', 'daily', 'weekly', 'monthly', 'annual']
export function resolveTime(time: string, exact = false): TimePeriod | null {
    if(exact) return timePeriods.find(t => t === time) ?? null
    if(['alltime'].includes(time.toLowerCase())) return 'alltime'
    if(['daily', 'day', 'today', 'days'].includes(time.toLowerCase())) return 'daily'
    if(['weekly', 'week', 'weeks'].includes(time.toLowerCase())) return 'weekly'
    if(['monthly', 'month', 'months'].includes(time.toLowerCase())) return 'monthly'
    if(['annual', 'yearly', 'year', 'annually', 'years'].includes(time.toLowerCase())) return 'annual'
    return null
}
export type StatType = 'points' | 'messages' | 'voice' | 'daily' | 'reps' | 'invites' | 'bumps' | 'counts'
export const statTypes: StatType[] = ['points', 'messages', 'voice', 'daily', 'reps', 'invites', 'bumps', 'counts']
export function resolveStat(stat: string, exact = false): StatType | null {
    if(exact) return statTypes.find(s => s === stat) ?? null
    if(['points', 'point', 'level', 'levels', 'leveling', 'score', 'scores'].includes(stat.toLowerCase())) return 'points'
    if(['messages', 'message', 'messaging'].includes(stat.toLowerCase())) return 'messages'
    if(['voice', 'voices', 'vc', 'voicechat', 'talk', 'talking'].includes(stat.toLowerCase())) return 'voice'
    if(['daily', 'streak', 'dailies', 'dailys'].includes(stat.toLowerCase())) return 'daily'
    if(['reps', 'rep', 'reputation'].includes(stat.toLowerCase())) return 'reps'
    if(['invites', 'invite', 'inviting', 'inviter'].includes(stat.toLowerCase())) return 'invites'
    if(['bumps', 'bump', 'bumping', 'bumper', 'disboard'].includes(stat.toLowerCase())) return 'bumps'
    if(['counts', 'count', 'counting', 'counter'].includes(stat.toLowerCase())) return 'counts'
    return null
}
export type DailyType = 'total' | 'current' | 'highest'
export const dailyTypes: DailyType[] = ['total', 'current', 'highest']
export function resolveDailyType(arg: string): DailyType | null {
    if(['total', 'all'].includes(arg.toLowerCase())) return 'total'
    if(['current', 'now', 'streak'].includes(arg.toLowerCase())) return 'current'
    if(['highest', 'high', 'highscore', 'most'].includes(arg.toLowerCase())) return 'highest'
    return null
}
export type RepsType = 'received' | 'given'
export const repsTypes: RepsType[] = ['received', 'given']
export function resolveRepsType(arg: string): RepsType | null {
    if(['received', 'receives', 'got'].includes(arg.toLowerCase())) return 'received'
    if(['given', 'gave', 'gived', 'gives'].includes(arg.toLowerCase())) return 'given'
    return null
}
export type InvitesType = 'joins' | 'leaves' | 'returns'
export const invitesTypes: InvitesType[] = ['joins', 'leaves', 'returns']
export type InviteDisplayType = 'joined' | 'left' | 'here' | 'stayed'
export const inviteDisplayTypes: InviteDisplayType[] = ['joined', 'left', 'here', 'stayed']
export function resolveInviteDisplayType(arg: string): InviteDisplayType | null {
    if(['joined', 'join', 'joins', 'all', 'alltime', 'invited', 'list'].includes(arg.toLowerCase())) return 'joined'
    if(['left', 'leave', 'leaves'].includes(arg.toLowerCase())) return 'left'
    if(['here', 'now', 'current', 'present'].includes(arg.toLowerCase())) return 'here'
    if(['stayed', 'stay', 'stays', 'staying', 'always'].includes(arg.toLowerCase())) return 'stayed'
    return null
}
export type StatOptions = { amount?: number, stored?: number} 
& Partial<Rep> & Partial<Invite<number>> & Partial<Daily>

const NumberStatSchema = {
    alltime:  { type: Number, default: 0 },
    daily:  { type: Number, default: 0 },
    weekly: { type: Number, default: 0 },
    monthly:{ type: Number, default: 0 },
    annual: { type: Number, default: 0 },
}
const RepSchema = {
    given:      { type: Number, default: 0 },
    received:   { type: Number, default: 0 },
}
const InviteSchema = {
    joins:  { type: Number, default: 0 },
    leaves: { type: Number, default: 0 },
    returns:{ type: Number, default: 0 },
}
const DailySchema = {
    total:  { type: Number, default: 0 },
    current:{ type: Number, default: 0 },
    highest:{ type: Number, default: 0 },
}
const userStatSchema = new Mongoose.Schema<UserStat, Mongoose.Model<UserStat>>({
    _id: String,
    lastReset: { type: Date, default: new Date() },
    points: NumberStatSchema,
    messages: {
        ...NumberStatSchema,
        lastReward: { type: Date, default: new Date(0) },
    },
    voice: {
        ...NumberStatSchema,
        lastReward: { type: Date, default: new Date(0) },
        lastUpdate: { type: Date, default: new Date(0) },
        inVoice: { type: Boolean, default: false },
    },
    daily: {
        nextReward: { type: Date, default: new Date(0) },
        total:  { type: Number, default: 0 },
        current:{ type: Number, default: 0 },
        highest:{ type: Number, default: 0 },
        daily: DailySchema,
        weekly: DailySchema,
        monthly: DailySchema,
        annual: DailySchema,
    },
    reps: {
        latest: { type: Date, default: new Date(0) },
        lastGiven: { type: Date, default: new Date(0) },
        lastReceiver: String,
        lastGiver: String,
        stored: { type: Number, default: 1 },
        given:  { type: Number, default: 0 },
        received: { type: Number, default: 0 },
        daily: RepSchema,
        weekly: RepSchema,
        monthly: RepSchema,
        annual: RepSchema,
    },
    invites: {
        latest: { type: Date, default: new Date(0) },
        joins: [String],
        leaves: [String],
        returns: [String],
        daily: InviteSchema,
        weekly: InviteSchema,
        monthly: InviteSchema,
        annual: InviteSchema,
    },
    bumps: NumberStatSchema,
    counts: NumberStatSchema,
}, { timestamps: true })

userStatSchema.methods.resetTimePeriods = function () {
    const now = Date.now()
    const last = this.lastReset.getTime()
    let doc: any = {}
	for(const stat of statTypes) {
        let date = new Date(now)
        let value: number | Daily | Rep | Invite<number> = 0
        if(stat === 'daily') value = { total: 0, current: 0, highest: 0 }
        if(stat === 'reps') value = { received: 0, given: 0 }
        if(stat === 'invites') value = { joins: 0, leaves: 0, returns: 0 }
        timePeriods.forEach(time => {
            if(time === 'daily') date.setHours(0, 0, 0)
            else if(time === 'weekly') Time.setDay(date)
            else if(time === 'monthly') date.setDate(1)
            else if(time === 'annual') date.setMonth(0)
            if(time !== 'alltime' && last < date.getTime())
                doc[`${stat}.${time}`] = this[stat][time] = value
        })
		//  if(last < date.getTime()) doc[`${stat}.daily`] = this[stat].daily = value
        // Time.setDay(date); if(last < date.getTime()) doc[`${stat}.weekly`] = this[stat].weekly = value
		// date.setDate(1); if(last < date.getTime()) doc[`${stat}.monthly`] = this[stat].monthly = value
		// date.setMonth(0); if(last < date.getTime()) doc[`${stat}.annual`] = this[stat].annual = value
	}
    doc.lastReset = this.lastReset = new Date(now)
    this.updateOne({ $set: doc }, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}
userStatSchema.methods.getStat = function (stat: StatType, time: TimePeriod = 'alltime', option?: DailyType | RepsType | InviteDisplayType) {
    if(stat === 'daily') {
        if(!(dailyTypes as string[]).includes(option ?? 'current')) option = 'current'
        if(time === 'alltime') return this.daily[option as DailyType]
        else return this.daily[time][option as DailyType]
    } else if(stat === 'reps') {
        if(!(repsTypes as string[]).includes(option ?? 'received')) option = 'received'
        if(time === 'alltime') return this.reps[option as RepsType]
        else return this.reps[time][option as RepsType]
    } else if(stat === 'invites') {
        const joined = time === 'alltime' ? this.invites.joins.length : this.invites[time].joins
        const left = time === 'alltime' ? this.invites.leaves.length : this.invites[time].leaves
        const returns = time === 'alltime' ? this.invites.returns.length : this.invites[time].returns
        if(option === 'left') return left
        if(option === 'here') return joined - left
        if(option === 'stayed') return joined - left - returns
        return joined
    } else {
        return this[stat][time]
    }
}
userStatSchema.methods.addStat = function (stat: StatType, amount: StatOptions | number) {
    let amt: StatOptions
    if(typeof amount === 'number') amt = { amount }
    else amt = amount
    let doc: any = {}
    timePeriods.forEach(time => {
        if(stat === 'daily') {
            dailyTypes.forEach(option => {
                if(time === 'alltime') {
                    doc[`${stat}.${option}`] = amt[option] ?? 0
                    this[stat][option] += amt[option] ?? 0
                } else {
                    doc[`${stat}.${time}.${option}`] = amt[option] ?? 0
                    this[stat][time][option] += amt[option] ?? 0
                }
            })
        } else if(stat === 'reps') {
            this.reps.stored += amt.stored ?? 0
            doc[`${stat}.stored`] = amt.stored ?? 0
            repsTypes.forEach(option => {
                if(time === 'alltime') {
                    doc[`${stat}.${option}`] = amt[option] ?? 0
                    this[stat][option] += amt[option] ?? 0
                } else {
                    doc[`${stat}.${time}.${option}`] = amt[option] ?? 0
                    this[stat][time][option] += amt[option] ?? 0
                }
            })
        } else if(stat === 'invites') {
            invitesTypes.forEach(option => {
                if(time !== 'alltime') {
                    doc[`${stat}.${time}.${option}`] = amt[option] ?? 0
                    this[stat][time][option] += amt[option] ?? 0
                }
            })
        } else {
            doc[`${stat}.${time}`] = amt.amount ?? 0
            this[stat][time] += amt.amount ?? 0
        }
    })
    this.updateOne({ $inc: doc }, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}
userStatSchema.methods.addMessage = function() {
    this.addStat('messages', 1)
    const cooldown = Date.now()-this.messages.lastReward.getTime()
    if(config.messages.cooldown*Time.min - cooldown > 0) return
    this.addStat('points', Tools.randomRange(config.messages.points))
    this.messages.lastReward = new Date()
    this.updateOne({ $set: { 
        'messages.lastReward': this.messages.lastReward 
    }}, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}
userStatSchema.methods.updateVoice = function (inVoice: boolean) {
    let now = Date.now()
    if(this.voice.inVoice) {
        this.addStat('voice', now - this.voice.lastUpdate.getTime())
        const rewardTime = now - this.voice.lastReward.getTime()
        this.addStat('points', Tools.randomRange(config.voice.points, 
            Math.floor(rewardTime/(config.voice.cooldown*Time.min))))
        this.voice.lastUpdate = new Date(now)
        this.voice.lastReward = new Date(now - rewardTime%(config.voice.cooldown*Time.min))
    } else if(inVoice) {   // Start recording
        const missedTime = this.voice.lastUpdate.getTime() - this.voice.lastReward.getTime()
        this.voice.lastUpdate = new Date(now)
        this.voice.lastReward = new Date(now + missedTime)
    }
    this.voice.inVoice = inVoice
    this.updateOne({ $set: { 
        'voice.lastUpdate': this.voice.lastUpdate, 
        'voice.lastReward': this.voice.lastReward,
        'voice.inVoice': inVoice,
    }}, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}
userStatSchema.methods.getDailyCooldown = function (): number {
    return this.daily.nextReward.getTime() - Date.now()
}
userStatSchema.methods.claimDaily = function () {
    if(this.getDailyCooldown() > 0) return this
    let doc: any = {}
    this.addStat('daily', { total: 1, current: 1, 
        highest: this.daily.highest == this.daily.current ? 1 : 0 })
    this.addStat('points', config.daily[this.daily.current%7-1])
    if(this.getDailyCooldown() < -Time.day && this.daily.current > 0) timePeriods.forEach(time => {
        if(time === 'alltime') doc[`daily.current`] = this.daily.current = 1
        else doc[`daily.${time}.current`] = this.daily[time].current = 1
    })
    Profiles.get(this._id).then(profile => {
        const offset = Time.getTimezoneOffset(profile.timezone)
        let newReward = new Date(Date.now() + offset)
        newReward.setUTCHours(24, 0, 0)
        doc[`daily.nextReward`] = this.daily.nextReward = new Date(newReward.getTime() - offset)
        this.updateOne({ $set: doc }, { upsert: true, setDefaultsOnInsert: true }).exec()
    })
    return this
}

userStatSchema.methods.getRepCooldown = function() {
    return config.reps.cooldown*Time.min - (Date.now()-this.reps.lastGiven.getTime())
}
userStatSchema.methods.giveRep = function (member: string) {
    if(this.getRepCooldown() > 0 || this.reps.stored <= 0
         || this.reps.lastReceiver === member) return this
    this.addStat('reps', { given: 1, stored: -1 })
    this.addStat('points', config.reps.points.give)
    this.reps.lastGiven = new Date()
    this.reps.lastReceiver = member
    this.updateOne({ $set: { 
        'reps.lastGiven': this.reps.lastGiven, 
        'reps.lastReceiver': this.reps.lastReceiver,
    }}, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}
userStatSchema.methods.receiveRep = function (member: string) {
    this.addStat('reps', { received: 1, stored: 1 })
    this.addStat('points', config.reps.points.receive)
    this.reps.lastGiver = member
    this.updateOne({ $set: { 
        'reps.lastGiver': this.reps.lastGiver, 
    }}, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}

userStatSchema.methods.addInvite = function (member: string) {
    if(!this.invites.joins.includes(member)) {
        this.invites.joins.push(member)
        this.addStat('invites', { joins: 1 })
        this.addStat('points', config.invites.join)
        this.updateOne({ $addToSet: { 'invites.joins': member }
        }, { upsert: true, setDefaultsOnInsert: true }).exec()
    } else {
        let idx = this.invites.leaves.indexOf(member)
        if(idx >= 0) this.invites.leaves.splice(idx, 1)
        this.invites.returns.push(member)
        this.addStat('invites', { leaves: -1, returns: 1 })
        this.updateOne({ // @ts-ignore
            $pull: { 'invites.leaves': member },
            $addToSet: { 'invites.returns': member }
        }, { upsert: true, setDefaultsOnInsert: true }).exec()
    }
    return this
}
userStatSchema.methods.removeInvite = function (member: string) {
    if(!this.invites.joins.includes(member)) return this
    let idx = this.invites.returns.indexOf(member)
    if(idx >= 0) {
        this.invites.returns.splice(idx, 1)
        this.addStat('invites', { returns: -1 })
    } else this.addStat('points', -config.invites.leave)
    this.invites.leaves.push(member)
    this.addStat('invites', { leaves: 1 })
    this.updateOne({ // @ts-ignore
        $pull: { 'invites.returns': member },
        $addToSet: { 'invites.leaves': member }
    }, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}
userStatSchema.methods.addCount = function () {
    this.addStat('counts', 1)
    this.addStat('points', config.counts)
    return this
}
userStatSchema.methods.removeCount = function () {
    this.addStat('counts', -1)
    this.addStat('points', -config.counts)
    return this
}
userStatSchema.methods.addBump = function () {
    this.addStat('bumps', 1)
    this.addStat('points', config.bumps)
    return this
}
userStatSchema.methods.getLevel = function (levels: number[] = config.levels) {
    let level = levels.findIndex(pts => this.points.alltime < pts)
    if(level < 0) return levels.length
    return level
}

userStatSchema.post('updateOne', doc => {
    //console.log(`userstat updated`);
    updateLeaderboard()
})

export const UserStatModel = Mongoose.model<UserStat>("UserStat", userStatSchema)

export async function get(id: string) {
    let user = await UserStatModel.findById(id).exec() 
    if(user === null) return new UserStatModel({ _id: id })
    if(user.voice.inVoice) user.updateVoice(true)
    user.resetTimePeriods()
    return user
    // Should I use caching??
    // let userCache = cache.get(id)
    // if(!userCache) {
    //     userCache = {
    //         user: await UserStatModel.findById(id).exec() ?? new UserStatModel({ _id: id }),
    //         timer: setTimeout(() => cache.delete(id), cacheTimeout)
    //     }
    // } else {
    //     clearTimeout(userCache.timer)
    //     userCache.timer = setTimeout(() => cache.delete(id), cacheTimeout)
    // }
    // cache.set(id, userCache)
    // if(userCache.user.voice.inVoice) userCache.user.updateVoice(true)
    // userCache.user.resetTimePeriods()
    // return userCache.user
}
export async function getMany(ids: string[], callback: (user: UserStat) => any) {
    ids = [...new Set(ids)].filter(id => id !== '')
    return new Promise((resolve, reject) => {
        UserStatModel.find({ '_id': { $in: ids }}).cursor()
        .on('data', async (user: UserStat) => {
            let idx = ids.indexOf(user._id)
            if(idx >= 0) ids.splice(idx, 1)
            user.resetTimePeriods()
            callback(user)
        })
        .on('error', reject)
        .on('end', () => {
            ids.forEach(id => callback(new UserStatModel({ _id: id })))
            resolve('')
        })
    })
}
export async function count() {
    return await UserStatModel.countDocuments()
}
export function getScores() {
    const agg = (stat: StatType, time: TimePeriod) => {
        const timeStr = time === 'alltime' ? '' : `.${time}`
        if(stat === 'daily') return {
            received: `$daily${timeStr}.current`,
            given: `$daily${timeStr}.total`,
            highest: `$daily${timeStr}.highest`,
        }
        if(stat === 'reps') return {
            received: `$reps${timeStr}.received`,
            given: `$reps${timeStr}.given`,
        }
        if(stat === 'invites') return {
            joined: `$invites${timeStr}.joins`,
            left: `$invites${timeStr}.leaves`,
            here: { $subtract: [ `$invites${timeStr}.joins`, `$invites${timeStr}.leaves`]},
            stayed: { $subtract: [ `$invites${timeStr}.joins`, { $add: 
                [ `$invites${timeStr}.leaves`, `$invites${timeStr}.returns`]},
            ]},
        }
        return `$${stat}.${time}`
    }
    const timeAgg = (stat: StatType) => {
        return {
            alltime: agg(stat, 'alltime'),
            daily: agg(stat, 'daily'),
            weekly: agg(stat, 'weekly'),
            monthly: agg(stat, 'monthly'),
            annual: agg(stat, 'annual'),
        }
    }
    let aggregation = {
        bot: { $not: { $in: [ 
          false, { $ifNull: [ 
            { $map: {
              input: '$profiles',
              as: 'profile',
              in: '$$profile.bot'
            } }, [false]
          ] } 
        ] } },
        points: timeAgg('points'), messages: timeAgg('messages'), voice: timeAgg('voice'), 
        daily: timeAgg('daily'), reps: timeAgg('reps'), 
        invites: {
            ...timeAgg('invites'),
            alltime: {
                joined: { $size: '$invites.joins'  },
                left: { $size: '$invites.leaves'  },
                here: { $subtract: [ { $size: '$invites.joins'  }, { $size: '$invites.leaves' } ]},
                stayed: { $subtract: [ { $size: '$invites.joins' }, { $add: 
                    [{ $size: '$invites.leaves' }, { $size: '$invites.returns' }]},
                ]},
            },
        }, bumps: timeAgg('bumps'), counts: timeAgg('counts')
    }
    return UserStatModel.aggregate<{
        _id: string
        bot: boolean
        points: Stat<number>
        messages: Stat<number>
        voice: Stat<number>
        daily: Stat<Daily>
        reps: Stat<Rep>
        invites: Stat<{
            joined: number, left: number, 
            here: number, stayed: number
        }>
        bumps: Stat<number>
        counts: Stat<number>
    }>().lookup({
        from: 'profiles',
        localField: '_id',
        foreignField: '_id',
        as: 'profiles'
      }).project(aggregation)
}
export async function getPlace(stat: string, score: number) {
    const match: any = {}; match[stat] = { $gt: score }
    const place = (await getScores().match(match).count('count'))
    if(place.length === 0) return 1
    // @ts-ignore
    return place[0].count+1 as number
}

export function statCard(stat: StatType | 'all'): MessageEmbedOptions {
    if(stat === 'all') return {
        title: `Stats of {member.name}`,
        thumbnail: { url: '{member.avatar}' },
        fields: ['Level', 'Points', 'Messages', 'Voice Chat', 
        'Daily', 'Reputation', 'Invites', 'Bumps', 'Counting']
        .map((title, index) => { return {
            name: title,
            value: `{member.${['level', ...statTypes][index]}}`,
            inline: true,
        }})
    }
    let fields: { title: string, stat?: string, text?: string }[] = []
    if(stat === 'points') fields.push({ title: 'Level', stat: 'level' })
    if(stat === 'reps') fields.push({ title: 'Reputation', stat: 'reps' }, 
        { title: 'Latest', text: stripIndent`
        Given to {member.reps.lastReceiver}
        Received from {member.reps.lastGiver}`})
    fields.push({ title: 'All-Time', stat: `${stat}.alltime` })
    if(!['daily', 'reps', 'bumps', 'counts', 'invites'].includes(stat)) 
        fields.push({ title: 'Daily', stat: `${stat}.daily` })
    if(!['daily', 'invites'].includes(stat)) 
        fields.push({ title: 'Weekly', stat: `${stat}.weekly` })
    fields.push({ title: 'Monthly', stat: `${stat}.monthly` },
        { title: 'Annual', stat: `${stat}.annual` })
    return {
        title: oneLine`${['Leveling', 'Messaging', 'Voice Chat', 'Daily', 'Reputation', 
            'Disboard Bumping', 'Counting Game', 'Invite'][statTypes.indexOf(stat)]}
            Stats of {member.name}`,
        thumbnail: { url: '{member.avatar}' },
        fields: fields.map(field => { return {
            name: field.title,
            value: field.text ?? `{member.${field.stat}}`,
            inline: true,
        }}).concat(stat === 'invites' ? [{
            name: 'Recent Invites',
            value: `{member.invites.joins.10}`,
            inline: false,
        }] : []),
    }
}

export async function handleBump(message: Message) {
    if(message.guild?.id !== Discord.guild.id) return
    if(message.author.id === '302050872383242240') {
        const bump = (message.embeds[0] ?? {}).description ?? ''
        if(bump !== undefined && bump.includes('Bump done')) {
            const member = bump.slice(2, 20)
            let user = await get(member)
            user.addBump()
            log(`<@!${member}> got {stats.bumps} points bumping the server!`, [member], [])
        }
    }
}

export async function log(note: string, mentions: string[], pings: string[]) {
    let channel = Discord.findChannel(getLogChannel()) as TextChannel | NewsChannel
    if(!channel || (channel.type !== 'text' && channel.type !== 'news')) return
    let message = await channel.send(pings.map(ping => `<@!${ping}>`).join(' '), 
    { embed: await Discord.embed({ description: note, timestamp: Date.now() })})
    message.edit(pings.concat(mentions).map(ping => `<@!${ping}>`).join(' '))
    updateLeaderboard(false)
}
let lbUpdate = true, lbResend = true
async function updateLeaderboard(edit = true): Promise<void> {
	if(!lbUpdate) {
        if(!edit && lbResend) {
            lbResend = false
            setTimeout(() => {
                lbUpdate = true
                lbResend = true
                updateLeaderboard(false)
            }, 3000)
        } 
        return
    }
    lbUpdate = false
    setTimeout(() => lbUpdate = true, 3000)

	let embed = {
		title: 'Leveling System!',
		timestamp: Date.now(),
		description: stripIndents`
            Welcome to the server's leveling system! Stay active to earn points and level up!
            
            > ${oneLine`
            To get started, you don't really need to think much. I'll reward you points 
            when you send messages or spend time in voice chats. It's as simple as that!`}
            
            > ${oneLine`
            Of course, there are some other cool ways you can earn points as well,
            whether by inviting people, bumping our server with <@!302050872383242240>,
            or with the \`{prefix}daily\` rewards. But if you're new, just relax and have fun :)`}`,
		fields: [{
			name: 'Weekly Leaderboard',
			value: await Promise.all((await getScores()
            .match({bot: false}).sort(`-points.weekly`).limit(10)).map(async (user, idx) => {
                return `${idx+1}. <@!${user._id}> - ${user.points.weekly}`
            })),
			inline: true,
		}, {
			name: 'All-Time Leaderboard',
			value: await Promise.all((await getScores()
            .match({bot: false}).sort(`-points.alltime`).limit(10)).map(async (user, idx) => {
                let level = config.levels.findIndex(pts => user.points.alltime < pts)
                if(level < 0) level = config.levels.length
                return `${idx+1}. <@!${user._id}> - ${user.points.alltime} (lvl ${level})`
            })),
			inline: true,
		}]
	}
	let channelID = config.logging.channel
	let messageID = config.logging.leaderboard
    let channel = Discord.findChannel(config.logging.channel) as TextChannel | NewsChannel
    if(!channel || (channel.type !== 'text' && channel.type !== 'news')) return
	let message = await Discord.getMessage(channelID, messageID)
	if(edit && message) {
		message.edit('', {embed: await Discord.embed(embed)})
	} else {
		if(message) message.delete()
		message = await channel.send({embed: await Discord.embed(embed)})
		config.logging.leaderboard = message.id
	}
	saveConfig()
}

export const saveConfig = () => Obj.saveJSON(config, `stats.json`)
export function getReward(stat: Exclude<StatType,'points'>) {
    if(stat === 'messages' || stat === 'voice') {
        return config[stat].points
    } else if(['reps','invites','bumps','counts'].includes(stat)) {
        return config[stat as 'reps'|'invites'|'bumps'|'counts']
    }
}
export const getCooldown = (stat: 'messages'|'voice'|'reps') => config[stat].cooldown
export function setStat(stat: Exclude<StatType,'points'|'daily'>, value: { 
    amount?: number, 
    cooldown?: number, 
    give?: number, 
    receive?: number,
    join?: number,
    leave?: number,
} & Partial<Tools.Range>) {
    if(stat === 'messages' || stat === 'voice') {
        if(value.min) config[stat].points.min = value.min
        if(value.max) config[stat].points.max = value.max
        config[stat].points.max = Math.max(config[stat].points.min, config[stat].points.max)
        if(value.cooldown) config[stat].cooldown = value.cooldown
    } else if(stat === 'reps') {
        if(value.give) config.reps.points.give = value.give
        if(value.receive) config.reps.points.receive = value.receive
        if(value.cooldown) config[stat].cooldown = value.cooldown
    } else if(stat === 'invites') {
        if(value.join) config.invites.join = value.join
        if(value.leave) config.invites.leave = value.leave
    } else {
        if(value.amount) config[stat] = value.amount
    }
    saveConfig()
}
export const getDaily = (day: number) => config.daily[day-1]
export function setDaily(day: number, reward: number, save = true) {
    config.daily[Math.max(0, Math.min(6, day-1))] = reward
    if(save) saveConfig()
}
export const getLevel = (level: number) => config.levels[level-1]
export function setLevel(level: number, points: number, save = true) {
    config.levels[level] = points
    config.levels[0] = config.levels[0] ?? 0
    for(let i = 1; i < config.levels.length; i++) 
        config.levels[i] = Math.max(config.levels[i] ?? 0, config.levels[i-1])
    if(save) saveConfig()
}
export const isChannelEnabled = (channel: string) => !config.disabled.includes(channel)
export function enableChannel(channel: string, save = true) {
    const idx = config.disabled.indexOf(channel) 
    if(idx >= 0) {
        config.disabled.splice(idx, 1)
        if(save) saveConfig()
    }
}
export function disableChannel(channel: string, save = true) {
    if(isChannelEnabled(channel)) {
        config.disabled.push(channel)
        if(save) saveConfig()
    }
}
export const getLogChannel = () => config.logging.channel
export function setLogChannel(channel: string) {
    config.logging.channel = channel
    saveConfig()
}

export async function replace(str: string, user?: UserStat) {
    if(user) str = await Tools.replaceTags(str, 'member', async args => {
        if(args.length == 0) return null
        const stat = resolveStat(args[0], true)
        const time = resolveTime(args[1], true)
        if(stat === 'voice') {
           return Time.durationToStr(user.voice[time ?? 'alltime'])
        } else if(stat === 'daily') {
            if(time) return stripIndent`
                ${(time === 'alltime' ? user.daily : user.daily[time]).current}
                ${(time === 'alltime' ? user.daily : user.daily[time]).highest} highest
                ${(time === 'alltime' ? user.daily : user.daily[time]).total} total`
            else if(!args[1] || (dailyTypes as string[]).includes(args[1]))
                return `${user.daily[(args[1] ?? 'current') as DailyType]}`
            else if(args[1] === 'cooldown') {
                const cooldown = user.getDailyCooldown()
                return cooldown < 0 ? '0s' : Time.durationToStr(cooldown, 0, 2)
            }
        } else if(stat === 'reps') {
            if(time) return stripIndent`
                ${(time === 'alltime' ? user.reps : user.reps[time]).received} received
                ${(time === 'alltime' ? user.reps : user.reps[time]).given} given`
            else if(!args[1] || (repsTypes as string[]).concat('stored').includes(args[1])) 
                return `${user.reps[(args[1] ?? 'received') as RepsType | 'stored']}`
            else if(['lastGiver', 'lastReceiver'].includes(args[1])) {
                let person = user.reps[args[1] as 'lastReceiver'|'lastGiver']
                return person ? `<@!${person}>` : 'nobody ;-;'
            } else if(args[1] === 'cooldown') {
                const cooldown = user.getRepCooldown() 
                return cooldown < 0 ? 'Rep is ready!' : Time.durationToStr(cooldown, 0, 2)
            }
        } else if(stat === 'invites') {
            if(time === 'alltime') return stripIndent`
                ${user.invites.joins.length-user.invites.leaves.length}
                ${user.invites.joins.length} joined
                ${user.invites.leaves.length} left
                ${user.invites.returns.length} returned`
            else if(time) return stripIndent`
                ${user.invites[time].joins-user.invites[time].leaves}
                ${user.invites[time].joins} joined
                ${user.invites[time].leaves} left
                ${user.invites[time].returns} returned`
            else if(!args[1]) return `${user.invites.joins.length
                -user.invites.leaves.length}`
            else if(['joins','leaves','returns'].includes(args[1])) {
                let category = args[1] as 'joins'|'leaves'|'returns'
                let count = user.invites[category].length
                if(!Tools.isNumber(args[2])) return `${count}`
                count = Math.min(parseInt(args[2]), count)
                return count == 0 ? 'nobody ;-;' : 
                    `<@!${user.invites[category].slice(-count).join('> <@!')}>`
            } else if(['here', 'stayed'].includes(args[1])) {
                let invites = user.invites.joins
                    .filter(inv => !user.invites.leaves.includes(inv))
                if(args[1] === 'stayed') invites = invites
                    .filter(inv => !user.invites.returns.includes(inv))
                if(!Tools.isNumber(args[2])) return `${invites.length}`
                let count = Math.min(parseInt(args[2]), invites.length)
                return count == 0 ? 'nobody ;-;' : 
                    `<@!${invites.slice(-count).join('> <@!')}>`
            }
        } else if(stat !== null) {
            return user[stat][time ?? 'alltime'].toString()
        } else if(args[0] === 'level') {
            return user.getLevel().toString()
        }
        return null
    })
    str = await Tools.replaceTags(str, 'stats', async args => {
        let stat = resolveStat(args[0], true)
        if(stat === 'messages' || stat === 'voice') {
            if(args[1] === 'cooldown') return Tools.plural(config[stat].cooldown, ' min')
            else return oneLine`
                ${Tools.plural(config[stat].points.min, ' point')} to 
                ${Tools.plural(config[stat].points.max, ' point')}`
        } else if(stat === 'daily') {
            if(Tools.isNumber(args[1])) {
                const day = Math.max(1, Math.min(7, parseInt(args[1])))
                const reward = config.daily[day-1]
                return Tools.plural(reward, day == 7 ? ' rep' : ' point')
            } else return config.daily.slice(0, 6).map(reward => Tools.plural(reward, ' point'))
            .concat(Tools.plural(config.daily[6], ' rep')).join(', ')
        } else if(stat === 'reps') {
            if(['give', 'receive'].includes(args[1])) 
                return Tools.plural(config.reps.points[args[1] as 'give'|'receive'], ' point')
            else if(args[1] === 'cooldown') return Tools.plural(config.reps.cooldown, ' min')
        } else if(stat === 'invites') {
            if(args[1] === 'join') return Tools.plural(config[stat].join, ' point')
            else if(args[1] === 'leave') return Tools.plural(config[stat].leave, ' point')
            else return oneLine`
                ${Tools.plural(config[stat].join, ' point')},
                -${Tools.plural(config[stat].leave, ' point')} penalty for leaves`
        } else if(stat !== null && stat !== 'points') {
            return Tools.plural(config[stat], ' point')
        } else if(args[0] === 'levels') {
            return config.levels.map((points, level) => `${level}-${points}`).join(', ')
        } else if(args[0] === 'log') {
            if(args[1] === 'leaderboard') return oneLine`
                ${Discord.getURL(config.logging.channel, config.logging.leaderboard)}`
            else return `<#${config.logging.channel}>`
        } else if(args[0] === 'perm' && args.length > 1) {
            return `${isChannelEnabled(args[1]) ? '🟢' : '🔴'}`
        }
        return null
    })
    return str
}