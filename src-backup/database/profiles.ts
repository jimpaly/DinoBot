import * as Mongoose from 'mongoose'
import { Time, Tools } from '../tools'

export interface Profile extends Mongoose.Document {
    /** Unique identifier - Same as Discord user ID */    
    _id: string 
    /** The date the profile was created */
    createdAt: Date
    /** The date the profile was last updated */
    updatedAt: Date
    /** Whether or not the member is a bot */            
    bot: boolean
    /** User-set bio to show on the profile card */
    bio: string
    /** The background image url of the profile card */
    background: string
    /** The timezone the member is in */
    timezone: string
    /** All dates the member joined the server, including the inviter */
    joins: {
        /** The date the member joined the server */
        date: Date
        /** The inviter for the specific join */
        inviter: string | null
    }[]
    /** Record a new guild join */
    addInviter(member?: string): Profile
}

const profileSchema = new Mongoose.Schema<Profile, Mongoose.Model<Profile>>({
    _id: String,
    bot: { type: Boolean, default: false },
    bio: { type: String, default: '' },
    background: { type: String, default: '' },
    timezone: { type: String, default: '+0' },
    joins: [{
        date: { type: Date, default: new Date() },
        inviter: { type: String, default: null },
    }]
}, { timestamps: true })
profileSchema.methods.addInviter = function (member?: string) {
    this.joins.push({ date: new Date(), inviter: member ?? null })
    this.updateOne({ 
        $push: { joins: { date: new Date(), inviter: member ?? null }}
    }, { upsert: true, setDefaultsOnInsert: true }).exec()
    return this
}

const ProfileModel = Mongoose.model<Profile>('Profile', profileSchema)

/** Get the profile of a member with member ID */
export async function get(id: string) {
    let profile = await ProfileModel.findById(id).exec()
    if(!profile) return new ProfileModel({ _id: id })
    return profile
}

/** Replace tags in a string with profile variables */
export async function replace(str: string, profile?: Profile) {
    if(profile) str = await Tools.replaceTags(str, 'member', async args => {
        if(args[0] === 'bio') {
            return profile.bio
        } else if(args[0] === 'timezone') {
            if(!args[1]) return profile.timezone
            else if(args[1] === 'offset') {
                return ''+Math.round(Time.getTimezoneOffset(profile.timezone)/1800000)/2
            } else if(args[1] === 'time') {
                let time = Date.now() + Time.getTimezoneOffset(profile.timezone)
                return `${Time.getHour(time, false)}:${Time.getMinute(time, false)}`
            }
        }
        return null
    })
    return str
}