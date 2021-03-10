const fs = require('fs')
const Tools = require('./tools')
const Data = require('./data')

module.exports = {

    call(name, data) {
        switch(name) {
            case 'level': return commands['Leveling'].level(data)
            case 'count': return commands['Fun'].count(data)
            case 'uncount': return commands['Fun'].uncount(data)
            case 'react': return commands['Fun'].react(data)
        }
    },

    execute(message, args) {
        for(const category in commands) {
            for(const command of commands[category].commands) {
                if (!command.alias.includes(args[0].toLowerCase())) {
                } else if(command.guildOnly && message.channel.type === 'dm') {
                    Tools.fault(message.channel, 'It seems like that command can\'t be used in DMs!');
                } else if(command.developer && message.member.id !== Data.get('developer')) {
                } else if(!command.public && !message.member.hasPermission('ADMINISTRATOR') && message.member.id !== Data.get('developer')) {
                } else {
                    try { command.execute(message, args.slice(1)) }
                    catch (err) { Tools.error(message.channel, err) }
                    return
                }
            }
        }
    },

    dev(message, args) {
        if(args[0] === 'setActivity') {
            Data.set('status', { mode: args[1], message: args.slice(2).join(' ') })
            message.client.user.setActivity(Data.get('status'), Data.get('statusMode'))
            return true;
        }
    },



    /**
     * Get the info of a command
     * @param {string} alias The alias used for the command
     * @returns The command info (nothing if can't find)
     */
    getCommand(alias) {

        if(alias === undefined) return

        for(const category in commands) {
            for(const command of commands[category].commands) {
                if(command.alias.includes(alias.toLowerCase())) {
                    return command
                }
            }
        }
    },

    getCommands() {
        let categories = {}
        for(const category in commands) {
            categories[category] = []
            for(const command of commands[category].commands) {
                categories[category].push(command.alias[0])
            }
        }
        return categories
    }

}

// Load commands
const commands = {}
for (const file of ['utility', 'levels', 'fun']) {
	const command = require(`./commands/${file}`)
	commands[command.name] = command
}