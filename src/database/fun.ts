import { Discord, Obj, Tools } from '../tools'
import { Message } from 'discord.js'

let config = {
    counting: '',
    reaction: { channels: [''], members: [''] }
}

export async function handleCount(message: Message): Promise<any> {

    if(message.channel.id !== config.counting) return
    if(message.author.bot) return message.delete().catch(() => {})

    let messages = await message.channel.messages.fetch({limit: 2})
    let lastMessage = messages.last()

    if(lastMessage) {
        // Return if last count was edited
        if(lastMessage.editedAt) {
            lastMessage.delete().catch(() => {})
            return message.delete().catch(() => {})
        } // Return if last count was made by same author
        if(message.createdTimestamp - lastMessage.createdTimestamp < 600000 &&
            message.author.id === lastMessage.author.id) return message.delete().catch(error => {})
    }
    
    let number = message.content.split(/\s+/)[0]
    let lastNumber = lastMessage?.content.split(/\s+/)[0] ?? '0'
    if(!Tools.isNumber(lastNumber)) lastNumber = '0'
    if(!Tools.isNumber(number) || parseInt(number) - 1 != parseInt(lastNumber)) 
        return message.delete().catch(() => {})
}

export function react(message: Message) {

    if(!canReactIn(message.channel.id)) return
    if(!canReactTo(message.author.id)) return
    if(message.author.id === message.client.user?.id) return

    function isOwO(str: string) {
        if(str.length != 3) return false;
        if(!/^[ou]/.test(str) || !/[ou]$/.test(str)) return false;
        if(['w', 'v', '-', '_', '^', '=', 'n'].includes(str.slice(1, -1))) return true;
        return false;
    }
    function rep(str: string, rp: string) {
        return str === rp.charAt(0) ? rp.charAt(1) : rp.charAt(0)
    }

    const m = (message.content.match(/[0-9a-zA-Z].*[0-9a-zA-Z]/) ?? [''])[0]

    if(/creeper$|creepers$/.test(m.toLowerCase())) {
        message.channel.send('Awww Maaan~~');
    } else if(/^o+$/.test(m.toLowerCase().slice(0, -1)) && m.toLowerCase().endsWith('oof')) {
        message.channel.send(`<:oo1:816586405178376193>${'<:oo2:816586405157273642>'.repeat(m.length-3)}<:oof:816586405409062933>`)
    } else if(/^m+$/.test(m.toLowerCase().slice(1)) && m.toLowerCase().startsWith('hmm')) {
        for(const c of m) if(!['h', 'm'].includes(c.toLowerCase())) return
        message.channel.send(`What are you thinking about, <@${message.author.id}>?\n${'🤔'.repeat(Math.pow(m.length, 0.8))}`)
    } else if(/^(o+|u+)$/.test(m.toLowerCase().slice(1)) && /^(noo|nuu)/.test(m.toLowerCase())) {
        message.channel.send(m.replace(/[uo]/g, x => rep(x, 'uo')).replace(/[UO]/g, x => rep(x, 'UO')))
    } else if(isOwO(m.toLowerCase().slice(-3))) {
        message.channel.send(m.slice(-3).replace(/[uo]/g, $1 => rep($1, 'uo')).replace(/[UO]/g, $1 => rep($1, 'UO')))
    } else if(/^[OU]/.test(m.slice(-3)) && /[OU]$/.test(m.slice(-3)) && ['o', 'u'].includes(m.charAt(m.length-2))) {
        message.channel.send(m.slice(-3).replace(/[UO]/g, $1 => rep($1, 'UO')))
    } else if(['meow', 'nyah'].includes(m.toLowerCase().slice(-4))) {
        message.channel.send(m.slice(-4)
            .replace(/[mn]/g, $1 => rep($1, 'mn')).replace(/[MN]/g, $1 => rep($1, 'MN'))
            .replace(/[ey]/g, $1 => rep($1, 'ey')).replace(/[EY]/g, $1 => rep($1, 'EY'))
            .replace(/[oa]/g, $1 => rep($1, 'oa')).replace(/[OA]/g, $1 => rep($1, 'OA'))
            .replace(/[wh]/g, $1 => rep($1, 'wh')).replace(/[WH]/g, $1 => rep($1, 'WH'))
        )
    }
}

export const readConfig = async () => {config = await Obj.readJSON('fun.json')}
export const saveConfig = () => Obj.saveJSON(config, 'fun.json')
export const getCountingChannel = () => config.counting
export function setCountingChannel(channel: string) {
    config.counting = channel
    saveConfig()
}
export const canReactTo = (member: string) => !config.reaction.members.includes(member)
export function disableReactionTo(member: string) {
    if(!config.reaction.members.includes(member)) {
        config.reaction.members.push(member)
        saveConfig()
    }
}
export function enableReactionTo(member: string) {
    const idx = config.reaction.members.indexOf(member)
    if(idx > 0) {
        config.reaction.members.splice(idx, 1)
        saveConfig()
    }
}
export const canReactIn = (channel: string) => !config.reaction.channels.includes(channel)
export function disableReactionIn(channel: string) {
    if(!config.reaction.channels.includes(channel)) {
        config.reaction.channels.push(channel)
        saveConfig()
    }
}
export function enableReactionIn(channel: string) {
    const idx = config.reaction.channels.indexOf(channel)
    if(idx > 0) {
        config.reaction.channels.splice(idx, 1)
        saveConfig()
    }
}

export async function replace(str: string, member?: Discord.User) {
    str = await Tools.replaceTags(str, 'counting', args => {
        if(args[0] === 'channel') return `<#${config.counting}>`
        return null
    })
    if(member) str = await Tools.replaceTags(str, 'member', args => {
        if(args[0] === 'reactions') return canReactTo(member.id) ? '🟢 enabled' : '🔴 disabled'
        return null
    })
    str = await Tools.replaceTags(str, 'reactions', args => {
        if(args[0] === 'perm' && args.length > 1) return `${canReactIn(args[1]) ? '🟢' : '🔴'}`
        return null
    })
    return str
}