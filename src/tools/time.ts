export const sec = 1000
export const min = 60000
export const hr = 3600000
export const day = 86400000


/** Set the date to a specific day of the week it is in */
export function setDay(date: Date, weekday = 1) {
	let day = date.getDay()
	if(day < weekday) day += 7
	date.setHours(-24 * (day - weekday))
}
/** Converts the number of milliseconds to a viewable string, in the format _d _h _m _s\
 *  For `start` and `end`, // 0 = second, 1 = minute, 2 = hour, and 3 = day
 */
export function durationToStr(duration: number, start = 1, end = 3, dynamic = true) { 
	if(dynamic) {
		if(end >= 3 && getDay(duration) > 0) {
			start = Math.max(start, 2); end = 3
		} else if(end >= 2 && getHour(duration, true) > 0) {
			start = Math.max(start, 1); end = 2
		} else if(getMinute(duration, true) > 0) {
			start = Math.max(start, 0); end = 1
		} else {
			start = Math.max(start, 0); end = Math.max(start, 0)
		}
	}
	let str = ''
	if(end == 0) return   `${getSecond(duration, true)}s`
	if(start == 0) str = ` ${getSecond(duration, false)}s`
	if(end == 1) return   `${getMinute(duration, true)}m${str}`
	if(start <= 1) str = ` ${getMinute(duration, false)}m${str}`
	if(end == 2) return   `${getHour(duration, true)}h${str}`
	if(start <= 2) str = ` ${getHour(duration, false)}h${str}`
	return `${getDay(duration)}d${str}`
}
/** Get the number of days from number of milliseconds */
export function getDay(duration: number) {
	return Math.floor(duration / 86400000)
}
/** Get the number of hours from number of milliseconds */
export function getHour(duration: number, end = true) {
	if(end) return Math.floor(duration / 3600000)
	return Math.floor((duration / 3600000) % 24)
}
/** Get the number of minutes from number of milliseconds */
export function getMinute(duration: number, end = false) {
	if(end) return Math.floor(duration / 60000)
	return Math.floor((duration / 60000) % 60)
}
/** Get the number of seconds from number of milliseconds */
export function getSecond(duration: number, end = false) {
	if(end) return Math.floor(duration / 1000)
	return Math.floor((duration / 1000) % 60)
}

/** Parse a string into a valid timezone identifier */
export function getTimezone(timezone: string) {
	try {
		new Date().toLocaleString('en-US', { timeZone: timezone })
	} catch {
		if(/^(|\+|\-)[0-9]+(:| )[0-9]+$/.test(timezone)) {
		  let times = timezone.replace(/\+|\-/, '').split(/:| /).map(time => parseInt(time))
		  return (timezone.includes('-') ? '-' : '+') + ((times[0]%24) + Math.round(times[1]%60/30)/2)
		} else if(/^(|\+|\-)[0-9]+(\.|\,)[0-9]+$/.test(timezone)) {
		  let time = parseFloat(timezone.replace(',', '.'))
		  return (time%24 < 0 ? '' : '+') + Math.round(time%24*2)/2
		} else if(/^(|\+|\-)[0-9]+$/.test(timezone)) {
            let time = parseInt(timezone)
		  return (time%24 < 0 ? '' : '+') + time%24
		} else return
	}
	return timezone
}
/** Get the timezone offset from UTC of a timezone\
 *  Make sure to have gotten the valid string with getTimezone() first
 */
export function getTimezoneOffset(timezone: string) {
	if(timezone === undefined || typeof timezone !== 'string') return 0
	let date = new Date(), tzDate: Date
	try { tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone })) } 
	catch { return parseFloat(getTimezone(timezone) ?? '+0') * hr }
	let diff = tzDate.getTime() - date.getTime() - date.getTimezoneOffset()*60000
	return Math.round(diff/1800000)/2 * hr
}