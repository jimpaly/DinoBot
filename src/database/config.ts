import { oneLine } from 'common-tags';
import { Obj, Draw, Discord } from '../tools'
import { ActivityOptions, ActivityType } from 'discord.js'
import { CommandoClient } from 'discord.js-commando'


let config = {
    prefix: "",
    status: { mode: "", message: "" },
    color: "",
    disabled: [""],
}

/** Replace tags in string with config variables */
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

/** Load the config file */
export const read = async () => {config = await Obj.readJSON('config.json')}
let saveTimer: NodeJS.Timeout | null = null
/** Save the config file */
export const save = () => Obj.saveJSON(config, 'config.json')

interface StatusOptions {
    message?: string,
    mode?: string,
}
/** Get the bot activity status to display */
export function getStatus(): ActivityOptions {
    return { 
        name: config.status.message, 
        type: config.status.mode as ActivityType,
    }
}
/** Set a new bot activity status */
export function setStatus(options: StatusOptions) {
    config.status.message = options.message ?? config.status.message
    config.status.mode = options.mode ?? config.status.mode
    save()
}

/** Get the bot prefix */
export const getPrefix = () => config.prefix
/** Set a new bot prefix */
export const setPrefix = (prefix: string) => { 
    config.prefix = prefix.trim();
    (Discord.guild.client as CommandoClient).commandPrefix = config.prefix
    save() 
}

/** Get the bot color (used for embeds) */
export const getColor = () => config.color
/** Set the bot color (used for embeds) */
export const setColor = (color: string) => { config.color = Draw.parseHex(color); save() }

/** Check whether the bot is configured to see a channel */
export const isChannelEnabled = (channel: string) => !config.disabled.includes(channel)
/** Enable a channel for the bot to see */
export function enableChannels(...channels: string[]) { 
    channels.forEach(channel => {
        const idx = config.disabled.indexOf(channel) 
        if(idx >= 0) config.disabled.splice(idx, 1)
    })
    save()
}
/** Set a channel for the bot to ignore */
export function disableChannels(...channels: string[]) {
    channels.forEach(channel => {
        if(isChannelEnabled(channel)) config.disabled.push(channel)
    })
    save()
}