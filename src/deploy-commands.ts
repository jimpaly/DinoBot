import glob from 'glob'
import { promisify } from 'util'
import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord-api-types/v9'
import { Intents } from 'discord.js'
import * as dotenv from 'dotenv'
import { Module } from './bot-framework'
import assert = require('assert')

const globPromise = promisify(glob)

dotenv.config();

// declare function assert(value: unknown): asserts value;

(async function() {

	const commands: RESTPostAPIApplicationCommandsJSONBody[] = []

	for (const file of await globPromise(`${__dirname}/modules/**/index.js`)) {
		const module = (await require(file)) as Module
		for (const command of await module.loadCommands()) {
			if (command.disabled || command.type == 'text') continue
			commands.push(command.getSlashCommand())
		}
	}

	assert(process.env.BOT_TOKEN != undefined)
	assert(process.env.CLIENT != undefined)
	assert(process.env.GUILD != undefined)
	const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);
	rest.put(Routes.applicationGuildCommands(process.env.CLIENT, process.env.GUILD), { body: commands })
		.then(() => console.log(`Successfully registered ${commands.length} slash commands.`))
		.catch(console.error);
})()
