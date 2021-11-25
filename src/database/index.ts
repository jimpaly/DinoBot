import { 
	addPouchPlugin, createRxDatabase, getRxStoragePouch, 
	JsonSchema, RxDatabase
} from 'rxdb';
import * as config from './config';

export * as MemberStats from './memberstats'
import * as MemberStats from './memberstats'

addPouchPlugin(require('pouchdb-adapter-node-websql'));

type DatabaseCollections = {
	stats: MemberStats.Collection
}
export type Database = RxDatabase<DatabaseCollections>

export async function load() {
	global.database = await createRxDatabase<DatabaseCollections>({
		name: `${process.env.DIRECTORY}/db/botdb`,
		storage: getRxStoragePouch('websql')
	})
	await global.database.addCollections({
		stats: MemberStats.collection
	})
	await config.load()
}