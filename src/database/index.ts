import { Message } from 'discord.js'
import { Discord, Obj } from '../tools'
import * as _Config from './config'
import * as _Stats from './stats'
import * as _Profiles from './profiles'
import * as _Fun from './fun'

export * as Config from './config'
export * as Stats from './stats'
export * as Profiles from './profiles'
export * as Fun from './fun'

export interface ReplaceVars {
    message?: Message
    member?: Discord.User
    user?: _Stats.UserStat
    profile?: _Profiles.Profile
}

/* 
 * Replaces keys in a string with data from the client
 * @param {string} str The string to replace
 */
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

export async function replace(obj: any, vars: ReplaceVars = {}) {
    if(!vars.member && vars.message) vars.member = vars.message.member ?? vars.message.author
    if(!vars.user) vars.user = await _Stats.get(vars.member?.id ?? '')
    if(!vars.profile) vars.profile = await _Profiles.get(vars.member?.id ?? '')
    return Obj.replace(obj, str => replaceStr(str, vars))
}