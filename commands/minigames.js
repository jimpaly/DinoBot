const Tools = require('../tools')
const Data = require('../bot')

module.exports = {
	name: 'Minigames',
	description: 'Play and configurate different minigames',
	detail: 'With this command, you can configurate the minigames I have. For now the only minigame is the counting game lol. But look out for more in the future!',
	alias: ['minigames', 'minigame', 'mg', 'game', 'games'],
	usage: [
		['minigames counting [#channel]', 'Set the channel to play the counting minigame!']
	],
	public: false,
	developer: false,
	guildOnly: true,
	execute(message, args) {
        if(args.length < 1) { 
			return
        } else if(['counting', 'count', 'cnt', 'c'].includes(args[0])) {
			counting(message)
		}
	},
	async count(message) {

		messages = await message.channel.messages.fetch({limit: 2})
		lastMessage = messages.last()

		// Return if last count was edited
		if(lastMessage.editedTimestamp > 0) {
			lastMessage.delete()
			return message.delete()
		} // Return if last count was made by same author
		if(message.createdTimestamp - lastMessage.createdTimestamp < 600000 &&
			message.author.id === lastMessage.author.id) return message.delete()
		
		number = message.content.split(/\s+/)[0]
		lastNumber = lastMessage.content.split(/\s+/)[0]
		if(!lastNumber.match(/^[0-9]+$/)) lastNumber = "0"
		if(!number.match(/^[0-9]+$/) || number - 1 != lastNumber) message.delete()

        return true;
	},
};

function counting(message) {
	if(message.mentions.channels.size < 1) {
		message.channel.send({embed: Data.replace({ 
            description: 'Current counting channel: {minigames.counting}'
        })})
	} else {
        Data.setData('minigames.counting', message.mentions.channels.first().id)
		message.channel.send({embed: Data.replace({ 
            description: 'Changed the counting channel to {minigames.counting}'
        })})
	}
}
