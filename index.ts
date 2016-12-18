import * as path from 'path'
import * as fs from 'fs'
import { Readable } from 'stream'
const byline = require('byline')

/**
 * Creates an stream of JSON tracks from an iTunes Library XML file. 
 *
 * @param  String
 * @return ReadableStream of JSON objects
 */

export function getItunesTracks(librarypath: string) {

	let libraryID: string
	let trackObj: any = {}
	let isTrack: boolean = false
	let line: any

	let streamIn: any
	let streamOut: any = new Readable
	streamOut._read = function () { /* needed to fix init issues */ }

	streamIn = fs.createReadStream(librarypath)
	streamIn = byline.createStream(streamIn)
	streamIn.on('readable', () => {


		while (null !== (line = streamIn.read())) {

			if (line.indexOf("<key>Library Persistent ID</key>") > -1) {
				/* 
				ADD A KEY/VALUE PROPERTY 
				*/
				let iDString = String(line).match("<key>Library Persistent ID</key><string>(.*)</string>")
				libraryID = iDString[1]
			}
			else if (line.indexOf("<dict>") > -1) {
				/*
				START A NEW TRACK
				*/
				trackObj = {}
				isTrack = true
			} else if (line.indexOf("</dict>") > -1) {
				/* 
				END OF CURRENT TRACK 
				*/
				if (module.exports.objectIsMusicTrack(trackObj)) {

					console.log(`built track "${trackObj.Name}" by "${trackObj.Artist}"`)
					trackObj['Library Persistent ID'] = libraryID //add extra metadata
					//event.sender.send('ITUNES_TRACK', trackObj) //push it to the track stream
					//console.log(trackObj)
					streamOut.push(JSON.stringify(trackObj))

				}

				isTrack = false

			} else if (line.indexOf("<key>") > -1) {
				/* 
				ADD A KEY/VALUE PROPERTY 
				*/
				Object.assign(trackObj, module.exports.buildProperty(line));
			}

		}
	})

	streamIn.on('end', () => {
		console.log('xml stream has ended')
		streamOut.push(null)
	})

	streamIn.on('error', (err) => {
		console.log('stream error: ' + err)
		streamOut.push(null)
	})

	return streamOut
}

/**
 * Ensures we have a music track and not a video or other non-music item. 
 *
 * @param  Object
 * @return Boolean
 */
export function objectIsMusicTrack(obj) {
	if (
		(obj.Name || obj.Artist)
		&& !obj['Playlist ID']
		&& (obj.Kind ==
			(
				'MPEG audio file'
				|| 'AAC audio file'
				|| 'Matched AAC audio file'
				|| 'Protected AAC audio file'
				|| 'Purchased AAC audio file'
			)
		)
	) return true
	else return false
}

/**
 * Creates a simple object with a key/value pair from the current XML line. 
 *
 * @param  String
 * @return Object
 */
export function buildProperty(line) {
	let key = String(line).match("<key>(.*)</key>")
	let value = String(line).match("<integer>(.*)</integer>")
	if (!value) value = String(line).match("<date>(.*)</date>")
	if (!value) value = String(line).match("<string>(.*)</string>")

	let k = ''
	if (key != null && key.length > 1) k = key[1]
	let v = ''
	if (value != null && value.length > 1) v = value[1]
	let o = {}
	o[k] = v
	return o
}