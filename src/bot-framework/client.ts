import glob from 'glob'
import { promisify } from 'util'
import { Client, Collection, Interaction, Message } from "discord.js"
import { Module, Command } from '.'
import { matchKeyword } from './command'

const globPromise = promisify(glob)

export class BotClient extends Client {
	commands: Collection<string, Command<any>> = new Collection()

	/**
	 * loads all commands from files to this bot client
	 */
	async loadCommands() {
		this.commands = new Collection()

		for (const file of await globPromise(`${__dirname}/../modules/**/index.js`)) {
			const module = (await require(file)) as Module
			for (const command of await module.loadCommands()) {
				this.commands.set(command.name, command)
				// TODO: add to categories
			}
		}

		this.on('messageCreate', async (message: Message): Promise<any> => {
				//if(message.author.bot) return
				if(!this.user || message.author.id === this.user.id) return
				// TODO: check disabled channel

			// a text is a command if it starts with the required prefix
			if(message.content.startsWith(global.config.prefix)) {
				message.content = message.content.slice(global.config.prefix.length).trim()
			} else if(message.content.startsWith('<@!'+this.user.id+'>')) {
				message.content = message.content.slice(this.user.id.length+4).trim()
			} else return

				// find the command, then execute it
				for (const [_, command] of this.commands) {
					const keyword = matchKeyword(command, message.content)
					if (command.type !== 'slash' && keyword) {
						message.content = message.content.slice(keyword.length).trim()
						return await command.executeTextCommand(message)
					}
				}
		})

		this.on('interactionCreate', async (interaction: Interaction) => {
			if (!interaction.isCommand()) return
			// TODO: check disabled channel?
			const command = this.commands.get(interaction.commandName)
			if (command && command.type !== 'text') {
				await command.executeSlashCommand(interaction)
			} else {
				interaction.reply(`Oops! It looks like that command doesn't exist anymore! Please contact <@!${process.env.OWNER}>`)
			}
		})
	}
}