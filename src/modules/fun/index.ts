import { createModule } from "../../bot-framework"

module.exports = createModule({
	name: 'Fun',
	commands: [
		'counting',
		'reactions',
	],
	listeners: [
		'count-listener',
		'reactor',
	]
})