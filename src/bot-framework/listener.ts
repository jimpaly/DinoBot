import { Message, PartialMessage } from "discord.js"


type ListenerType = 'message' | 'voice'

export abstract class Listener {
	type: ListenerType
	isMessage(): this is MessageListener {
		return this.type === 'message'
	}
}

interface MessageListenerCreator {
	messageCreate?: (message: Message) => void,
	messageDelete?: (message: Message | PartialMessage) => void,
}
export class MessageListener extends Listener {
	constructor(
		readonly messageCreate: (message: Message) => void,
		readonly messageDelete: (message: Message | PartialMessage) => void,
	) { super() 
		this.type = 'message'
	}
}
export function createMessageListener({
	messageCreate = () => {},
	messageDelete = () => {},
}: MessageListenerCreator): MessageListener { 
	return new MessageListener(messageCreate, messageDelete)
}