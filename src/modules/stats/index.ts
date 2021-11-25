import { createModule } from "../../bot-framework";

module.exports = createModule({
	name: 'Stats',
	commands: [
		'stats'
	],
	listeners: [
		'message-listener'
	]
})