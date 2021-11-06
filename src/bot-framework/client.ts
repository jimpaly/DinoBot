import glob from 'glob'
import { promisify } from 'util'
import { Client, Collection, Interaction, Message } from "discord.js"
import { Module, Command, Category, CategoryOptions } from '.'

const globPromise = promisify(glob)

export class BotClient extends Client {
	commands: Collection<string, Command> = new Collection()
	// categories: Category[] = []

	async loadCommands(/* TODO options: CategoryOptions[]*/) {
		this.commands = new Collection()
		// this.categories = []

		for (const file of await globPromise(`${__dirname}/../modules/**/index.js`)) {
			const module = (await require(file)) as Module
			for (const command of await module.loadCommands()) {
				this.commands.set(command.name, command)
				// TODO: add to categories
			}
		}

		this.on('messageCreate', async (message: Message) => {
			//if(message.author.bot) return
			if(!this.user || message.author.id === this.user.id) return
			// TODO: check disabled channel
		
			let args: string[]
			if(message.content.startsWith(global.config.prefix)) {
				args = message.content.slice(global.config.prefix.length).trim().split(/\s+/)
			} else if(message.content.startsWith('<@!'+this.user.id+'>')) {
				args = message.content.slice(this.user.id.length+4).trim().split(/\s+/)
			} else return

			const lookup = args.shift()
			if (!lookup) return
			for (const [_, command] of this.commands) {
				if (command.matchesKeyword(lookup)) {
					return await command.executeTextCommand(message)
				}
			}
		})

		this.on('interactionCreate', async (interaction: Interaction) => {
			if (!interaction.isCommand()) return
			const command = this.commands.get(interaction.commandName)
			if (command) await command.executeSlashCommand(interaction)
		})
	}
}