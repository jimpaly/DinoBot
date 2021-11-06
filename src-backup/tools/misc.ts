
export interface Range {
    min: number,
    max: number,
}
/** Check if a string is a positive integer (contains only digits) */
export function isNumber(number: string) {
	return /^[0-9]+$/.test(number)
}
/** Parse a string to a positive integer. Returns undefined if it's invalid */
export function parseNumber(number: string) {
    if(isNumber(number)) return parseInt(number)
}
/** @returns a random integer between min and max (inclusive) */
export function random(min: number, max: number) {
	return Math.floor(Math.random() * (max+1-min)) + min;
}
/** @returns a random integer between range.min and range.max (inclusive) */
export function randomRange(range: Range, amount = 1) {
    let num = 0
    for(let i = 0; i < amount; i++) num += random(range.min, range.max)
    return num
}

/** Replace tags in a string conditionally with args */
export async function replaceTags(str: string, key: string, 
    callback: (args: string[]) => string | null | Promise<string | null>) {
    for(const match of str.match(/{.[^{}]+}/gi) ?? []) {
        const args = match.slice(1, -1).split('.')
        if(!key) str = str.replace(match, await callback(args) ?? match)
        if(args[0] === key) str = str.replace(match, await callback(args.slice(1)) ?? match)
    }
    return str
}

/** Space strings evenly. Used to create tables on discord */
export function align(str: string, length: number, alignment = 'center') {
    const leftover = Math.max(0, length - str.length)
    if(alignment  === 'left') {
        return str + Array(leftover).fill(' ').join('')
    } else if(alignment  === 'right') {
        return Array(leftover).fill(' ').join('') + str 
    } else {
        return Array(Math.floor(leftover/2)).fill(' ').join('') + str + Array(Math.ceil(leftover/2)).fill(' ').join('')
    }
}

/** @returns the number with a suffix added (1st, 2nd, 3rd...) */
export function numSuffix(num: number) {
    if(Math.floor(num%100/10) == 1) return `${num}th`;
    if(num%10 == 1) return `${num}st`;
    if(num%10 == 2) return `${num}nd`;
    if(num%10 == 3) return `${num}rd`;
    return `${num}th`;
}
/** Converts a float number to percent */
export function percent(num: number) {
    if(isNaN(num)) return '0%'
    return `${Math.round(num*100)}%`;
}
/** Adds a sign to the number, even if it's positive */
export function addSign(num: number) {
    return num<0 ? `${num}` : `+${num}`;
}
/** Makes a unit plural, depending on the amount */
export function plural(amount: number, unit: string) {
    return `${amount}${unit}${amount == 1 ? '' : 's'}`
}

/// VSCode console coloring
export const vslog = {
    red:    '\u001b[1;31m',
    green:  '\u001b[1;32m',
    yellow: '\u001b[1;33m',
    blue:   '\u001b[1;34m',
    purple: '\u001b[1;35m',
    cyan:   '\u001b[1;36m'
}