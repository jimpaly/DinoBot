import * as Canvas from 'canvas'

/** Make a rectangle with a background as a color and text displaying the hex value\
 *  If the hex isn't valid, it will be set to black (#000000)
 */
export function createColorImage(color: string, width = 500, height = 300) {

	const canvas = Canvas.createCanvas(width, height)
	const ctx = canvas.getContext('2d')

	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.font = `bold ${height/2}px Courier New`

	color = parseHex(color)
	if(color) {
		ctx.fillStyle = color
		ctx.fillRect(0, 0, width, height)

		const rgb = hexToRgb(color)
		ctx.fillStyle = (rgb.r*0.299 + rgb.g*0.587 + rgb.b*0.114) > 186 ? '#000000' : '#ffffff'
		ctx.fillText(color, width/2, height/2, width*0.9)
	} else {
		ctx.fillStyle = '#000000'
		ctx.fillRect(0, 0, width, height)
		ctx.fillStyle = '#ffffff'
		ctx.fillText('COLOR NOT SET', width/2, height/2, width*0.9)
	}

	return canvas.toBuffer()
}
/** Parse a hex string to the format the bot uses\
 *  Hex string must be 6 characters of hex digits (0-f), with or without a "#" in front
 */
export function parseHex(color: string) {
	if(!color.startsWith('#')) color = '#'+color
	if(color.length != 7 || !/^[0-9a-f]+$/i.test(color.slice(1))) return ''
	return color.toLowerCase()
}
/** Parse three rgb values (0-255) to a hex string */
export function rgbToHex(r: number, g: number, b: number) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
/** Parse a hex string into rgb values\
 *  Please use parseHex() to convert the hex to a valid string first
 */
export function hexToRgb(hex: string) {
	return {
		r: parseInt(hex.slice(1, 3), 16),
		g: parseInt(hex.slice(3, 5), 16),
		b: parseInt(hex.slice(5, 7), 16)
	}
}