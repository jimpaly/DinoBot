import { createMessageListener } from "../../bot-framework";

module.exports = createMessageListener({
	async messageCreate(message) {
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
            message.author.id === lastMessage.author.id) return message.delete().catch(() => {})
    }
    
    let number = message.content.split(/\s+/)[0]
    let lastNumber = lastMessage?.content.split(/\s+/)[0] ?? '0'
    if(!/^[0-9]+$/.test(lastNumber)) lastNumber = '0'
    if(!/^[0-9]+$/.test(number) || parseInt(number) - 1 != parseInt(lastNumber)) 
        return message.delete().catch(() => {})
	}
})