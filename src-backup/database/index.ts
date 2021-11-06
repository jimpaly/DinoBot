import { Message } from 'discord.js'
import { Discord, Obj } from '../tools'
import * as _Config from './config.js'
import * as _Stats from './stats.js'
import * as _Profiles from './profiles.js'
import * as _Fun from './fun.js'

export * as Config from './config.js'
export * as Stats from './stats.js'
export * as Profiles from './profiles.js'
export * as Fun from './fun.js'

export interface ReplaceVars {
    message?: Message
    member?: Discord.User
    user?: _Stats.UserStat
    profile?: _Profiles.Profile
}

/* Replaces tags in the string with data from config and database */
export async function replaceStr(str: string, vars: ReplaceVars = {}) {
    if(!vars.member && vars.message) vars.member = vars.message.member ?? vars.message.author
    str = _Config.replace(str)
    if(!vars.user) vars.user = await _Stats.get(vars.member?.id ?? '')
    if(!vars.profile) vars.profile = await _Profiles.get(vars.member?.id ?? '')
    str = await _Stats.replace(str, vars.user)
    str = await _Profiles.replace(str, vars.profile)
    str = await _Fun.replace(str, vars.member)
    if(vars.member) str = await Discord.replaceMember(str, vars.member)
    return str
}

/** Replace tags in all strings of the object with data from config files and the database */
export async function replace(obj: any, vars: ReplaceVars = {}) {
    if(!vars.member && vars.message) vars.member = vars.message.member ?? vars.message.author
    if(!vars.user) vars.user = await _Stats.get(vars.member?.id ?? '')
    if(!vars.profile) vars.profile = await _Profiles.get(vars.member?.id ?? '')
    return Obj.replace(obj, str => replaceStr(str, vars))
}