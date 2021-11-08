import { 
	addPouchPlugin, clone, createRxDatabase, getRxStoragePouch, 
	RxCollection, RxDatabase, RxDocument, RxJsonSchema, 
} from 'rxdb';
import { DeepReadonly, DeepReadonlyObject } from 'rxdb/dist/types/types';

addPouchPlugin(require('pouchdb-adapter-node-websql'));


type DatabaseCollections = {}
export type Database = RxDatabase<DatabaseCollections>

export async function load() {
	global.database = await createRxDatabase<DatabaseCollections>({
		name: `${process.env.DIRECTORY}/db/${process.env.DATABASE}`,
		storage: getRxStoragePouch('websql')
	})
}

export type ConfigID = 'config'
export interface ConfigDoc {
	prefix: string
	hello: {
			mode: string
			message: string[]
	}
}
export async function config() {
	await loadConfig('config', {
		prefix: ',',
		hello: {
			mode: '',
			message: ['message', '2'],
		},
		newelement: 3
	})
}
export async function saveConfig(id?: ConfigID) {
	if (!id || id === 'config') await global.database.upsertLocal('config', global.config)
}

function loadConfig<ID extends ConfigID, T extends (
	ID extends 'config' ? ConfigDoc : any
)>(id: ID, defaults: T) {
	return new Promise<void>(resolve => global.database.getLocal$<T>(id).subscribe(async document => {
		if (!document) global[id] = defaults
		else global[id] = copy(document.toJSON(), defaults)
		resolve()
	}))
}
export function copy<T>(obj: DeepReadonly<T> | T, defaults: T): T {
	if(obj === undefined) return defaults
	if (typeof defaults !== 'object') {
		if (typeof obj === 'object') return defaults
		return obj as T
	} else if(Array.isArray(defaults)) {
		if(!Array.isArray(obj)) return defaults
		const newObj: any = []
		for(const element in defaults)
			newObj[element] = copy(obj[element], defaults[element])
		// @ts-ignore
		return newObj as T
	} else {
		if (typeof obj !== 'object') return defaults
		const newObj: any = {}
		for(const property in defaults)
			newObj[property] = copy((obj as T)[property], defaults[property])
		return newObj as T
	}
}

