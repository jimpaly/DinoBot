import { oneLine } from 'common-tags';
import { Obj, Draw, Discord } from '../tools'
import { ActivityOptions, ActivityType } from 'discord.js'


let config = {
    prefix: "",
    status: { mode: "", message: "" },
    color: "",
    disabled: [""],
}

export function replace(str: string) {

    //Prefix
    str = str.replace(/{prefix}/gi, config.prefix + (/[a-z]$/i.test(config.prefix) ? ' ' : ''))

    //Perm
    str = str.replace(/{perm.(.*?)}/gi, (x) => isChannelEnabled(x.slice(6, -1)) ? 'disabled' : 'enabled')
    str = str.replace(/{channelperm.(.*?)}/gi, (x) => oneLine`
        ${isChannelEnabled(x.slice(6,-1)) ? '🟢' : '🔴'} <#${x.slice(6,-1)}>
    `)

    //Color
    str = str.replace(/{color}/gi, config.color)

    return str
}

export const read = async () => {config = await Obj.readJSON('config.json')}
export const save = () => Obj.saveJSON(config, 'config.json')

interface StatusOptions {
    message?: string,
    mode?: string,
}
export function getStatus(): ActivityOptions {
    return { 
        name: config.status.message, 
        type: config.status.mode as ActivityType,
    }
}
export function setStatus(options: StatusOptions) {
    config.status.message = options.message ?? config.status.message
    config.status.mode = options.mode ?? config.status.mode
    save()
}

export const getPrefix = () => config.prefix
export const setPrefix = (prefix: string) => { 
    config.prefix = prefix.trim()
    Discord.getClient().commandPrefix = config.prefix
    save() 
}

export const getColor = () => config.color
export const setColor = (color: string) => { config.color = Draw.parseHex(color); save() }

export const isChannelEnabled = (channel: string) => !config.disabled.includes(channel)
export function enableChannel(channel: string) { 
    const idx = config.disabled.indexOf(channel) 
    if(idx >= 0) {
        config.disabled.splice(idx, 1)
        save()
    }
}
export function disableChannel(channel: string) {
    if(isChannelEnabled(channel)) {
        config.disabled.push(channel)
        save()
    }
}