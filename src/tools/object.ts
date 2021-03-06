import * as fs from 'fs'

/** Copies all properties of an object to a new object */
export function clone(object: any): any {
	if(typeof object !== 'object') {
		return object
	} else if(Array.isArray(object)) {
		let newObject = []
		for(const element of object) {
			newObject.push(clone(element))
		}
		return newObject
	} else {
		let newObject: any = {}
		for(const property in object) {
			newObject[property] = clone(object[property])
		}
		return newObject
	}
}
/** Copy object into old object but keep existing properties */
export function copy(oldObj: any, newObj: any) {
	if(newObj === undefined) return clone(oldObj)
	if(oldObj === undefined) return clone(newObj)
	if(typeof newObj !== 'object' || typeof oldObj !== 'object') return newObj
	if(Array.isArray(newObj)) {
		if(!Array.isArray(oldObj)) {
			return clone(newObj)
		} else {
			let newObject = clone(oldObj)
			for(const element in newObj) {
				newObject[element] = copy(oldObj[element], newObj[element])
			}
			return newObject
		}
	} else {
		let newObject = clone(oldObj)
		for(const property in newObj) {
			newObject[property] = copy(oldObj[property], newObj[property])
		}
		return newObject
	}
}
/** Similar to copy() but doesn't make clones */
 export function paste(oldObj: any, newObj: any) {
	if(newObj === undefined) return oldObj
	if(oldObj === undefined) return newObj
	if(typeof newObj !== 'object' || typeof oldObj !== 'object') return newObj
	if(Array.isArray(newObj)) {
		if(!Array.isArray(oldObj)) {
			return newObj
		} else {
			let newObject = oldObj
			for(const element in newObj) {
				newObject[element] = paste(oldObj[element], newObj[element])
			}
			return newObject
		}
	} else {
		let newObject = oldObj
		for(const property in newObj) {
			newObject[property] = paste(oldObj[property], newObj[property])
		}
		return newObject
	}
}

/** runs replace recursively on all strings in an object */
export async function replace(object: any, replaceStr: (str: string) => string | Promise<string>): Promise<any> {
    if(typeof object === 'string') {
        return await replaceStr(object)
    } else if(typeof object !== 'object') {
        return object
    } else if(Array.isArray(object)) {
        let newObject = []
        for(const element of object) {
            newObject.push(await replace(element, replaceStr))
        }
        return newObject
    } else {
        let newObject: any = {}
        for(const property in object) {
            newObject[property] = await replace(object[property], replaceStr)
        }
        return newObject
    }
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