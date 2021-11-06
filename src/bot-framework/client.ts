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
		
			if(message.content.startsWith(global.config.prefix)) {
				message.content = message.content.slice(global.config.prefix.length).trim()
			} else if(message.content.startsWith('<@!'+this.user.id+'>')) {
				message.content = message.content.slice(this.user.id.length+4).trim()
			} else return

			for (const [_, command] of this.commands) {
				const keyword = command.findKeyword(message.content)
				if (command.type !== 'slash' && keyword) {
					message.content = message.content.slice(keyword.length).trim()
					return await command.executeTextCommand(message)
				}
			}
		})

		this.on('interactionCreate', async (interaction: Interaction) => {
			if (!interaction.isCommand()) return
			const command = this.commands.get(interaction.commandName)
			console.log(`executing slash command: ${command?.name}`)
			if (command && command.type !== 'text') {
				await command.executeSlashCommand(interaction)
			} else {
				interaction.reply(`Oops! It looks like that command doesn't exist anymore! Please contact <@!${process.env.OWNER}>`)
			}
		})
	}
}