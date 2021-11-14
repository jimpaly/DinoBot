import { 
	addPouchPlugin, clone, createRxDatabase, getRxStoragePouch, 
	RxCollection, RxDatabase, RxDocument, RxJsonSchema, 
} from 'rxdb';

addPouchPlugin(require('pouchdb-adapter-node-websql'));

type DatabaseCollections = {}
export type Database = RxDatabase<DatabaseCollections>

export async function load() {
	global.database = await createRxDatabase<DatabaseCollections>({
		name: `${process.env.DIRECTORY}/db/${process.env.DATABASE}`,
		storage: getRxStoragePouch('websql')
	})
}

