import { Command, load } from "."
import { Listener } from "./listener"

interface ModuleCreator {
	name: string
	commands?: string[]
	listeners?: string[]
}

/**
 * class defining a bot module. modules can contain 
 * commands, chat monitors, buttons, and other discord interaction stuff
 */
export interface Module {
	name: string
	readonly commands: Command<any>[]
	readonly listeners: Listener[]
}

export class ModuleLoader {
	constructor(
		readonly name: string,
		readonly commands: string[],
		readonly listeners: string[],
	) {}
	async load(directory: string): Promise<Module> {
		return {
			name: this.name,
			commands: await Promise.all(this.commands.map(file => (require(`../modules/${directory}/${file}.js`)))),
			listeners: await Promise.all(this.listeners.map(file => (require(`../modules/${directory}/${file}.js`)))),
		}
	}
}

export function createModule({
	name, commands = [], listeners = []
}: ModuleCreator): ModuleLoader {
	return new ModuleLoader(name, commands, listeners)
}