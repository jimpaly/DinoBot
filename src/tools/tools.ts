import * as readLine from 'readline'

export function print(cursor: number, message: string) {
	readLine.cursorTo(process.stdout, cursor)
	process.stdout.write(message)
}