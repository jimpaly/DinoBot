import * as fs from 'fs'
import { createRxDatabase, getRxStoragePouch, RxCollection, RxDatabase, RxDocument, RxJsonSchema } from 'rxdb';



export interface Config {
	prefix: string
	status: {
			mode: string
			message: string
	}
}

type ConfigDocType = {
	prefix: string
	status: {
		mode: string
		message: string
	}
}
type ConfigDocument = RxDocument<ConfigDocType, {}>
type ConfigCollection = RxCollection<ConfigDocType, {}, {}>

type DatabaseCollections = {
	config: ConfigCollection
}
export type Database = RxDatabase<DatabaseCollections>



export async function load() {
	// global.config = await readJSON('config.json') as Config
	global.database = await createRxDatabase<DatabaseCollections>({
		name: 'bot-db',
		storage: getRxStoragePouch('websql')
	})
	const configSchema: RxJsonSchema<ConfigDocType> = {
		title: 'config',
		description: 'bot configuration',
		version: 0,
		keyCompression: true,
		primaryKey: 'prefix',
		type: 'object',
		properties: {
			prefix: { type: 'string' },
			status: { type: 'object', properties: {
				mode: { type: 'string' },
				message: { type: 'string' },
			} },
		},
		required: ['prefix', 'status'],
	}
	await global.database.addCollections({
		config: {
			schema: configSchema,
		}
	})
	console.log(global.database.config.findOne())
}

/** Reads in an object from a JSON file, relative to `configuration/` */
export function readJSON(file: string) {
	return new Promise<any>((resolve, reject) => {
		fs.readFile(`./configuration/${file}`, 'utf8', (err, str) => {
			if (err) return reject(err)
			try { resolve(JSON.parse(str)) }
			catch(err) { reject(err) }
		})
	}).catch(err => console.error(`fault reading file ${file}:`, err))
}
/** saves an object to a JSON file, relative to `configuration/` */
export function saveJSON(object: object, file: string) {
	return new Promise<void>((resolve, reject) => {
		fs.writeFile(`./configuration/${file}`, JSON.stringify(object, null, 4), (err) => {
			if(err) reject(err)
			else resolve()
		})
	}).catch(err => console.error(`fault writing file ${file}:`, err))
}