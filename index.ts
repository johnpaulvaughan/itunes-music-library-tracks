import * as path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';
const byline = require('byline');

/**
 * Creates an stream of JSON tracks from an iTunes Library XML file.
 *
 * @param  String
 * @return ReadableStream of JSON objects
 */

export function getItunesTracks(librarypath: string) {
	let libraryID: string;
	let trackObj: any = {};
	let isTrack: boolean = false;
	let line: any;
	let trackCount: number = 0;

	let streamIn: any;
	let streamOut: any = new Readable();
	streamOut._read = function () {
		/* needed this stub to fix init issues */
	};

	streamIn = fs.createReadStream(librarypath);
	streamIn.on('error', () =>
		streamOut.emit('error', 'The file you selected does not exist')
	);
	streamIn = byline.createStream(streamIn);

	/*
	if (!module.exports.validPath(librarypath)) {
		streamOut.emit("error", 'Not a valid XML file')
	}
	*/

	streamIn.on('readable', () => {
		while (null !== (line = streamIn.read())) {
			if (line.indexOf('<key>Library Persistent ID</key>') > -1) {
				/* ADD A KEY/VALUE PROPERTY */
				let iDString = String(line).match(
					'<key>Library Persistent ID</key><string>(.*)</string>'
				);
				libraryID = iDString[1];
			} else if (line.indexOf('<dict>') > -1) {
				/* START A NEW TRACK */
				trackObj = {};
				isTrack = true;
			} else if (line.indexOf('<key>') > -1) {
				/* ADD A PROPERTY TO THE TRACK */
				(<any>Object).assign(trackObj, module.exports.buildProperty(line));
			} else if (line.indexOf('</dict>') > -1) {
				/* END OF CURRENT TRACK */
				if (module.exports.objectIsMusicTrack(trackObj)) {
					trackObj['Library Persistent ID'] = libraryID; //add extra metadata
					trackCount++;
					streamOut.push(JSON.stringify(trackObj));
				}
				isTrack = false;
			}
		}
	});

	streamIn.on('end', () => {
		if (trackCount == 0) streamOut.emit('error', 'No tracks exist in the file');
		trackCount = 0; //reset it
		streamOut.push(null);
	});

	streamIn.on('error', err => {
		streamOut.emit('error', 'Error parsing iTunes XML');
	});

	return streamOut;
}

/**
 * Creates an stream of JSON playlists from an iTunes Library XML file.
 *
 * @param  String
 * @return ReadableStream of JSON objects
 */

export function getItunesPlaylists(librarypath: string) {
	let libraryID: string;
	let reachedPlaylistCollection: boolean = false;
	let playlistObj: any = {};
	let isPlaylist: boolean = false;
	let line: any;
	let playlistCount: number = 0;

	let dictDepth: number = 0;

	let streamIn: any;
	let streamOut: any = new Readable();
	streamOut._read = function () {
		/* needed this stub to fix init issues */
	};

	streamIn = fs.createReadStream(librarypath);
	streamIn.on('error', () =>
		streamOut.emit('error', 'The file you selected does not exist')
	);
	streamIn = byline.createStream(streamIn);

	streamIn.on('readable', () => {
		while (null !== (line = streamIn.read())) {
			if (!reachedPlaylistCollection) {
				if (line.indexOf('<key>Playlists</key>') > -1)
					reachedPlaylistCollection = true;
			} else {
				if (line.indexOf('<dict>') > -1) {
					dictDepth++;
					if (dictDepth == 1) {
						/* START A NEW playlist */
						playlistObj = {};
						playlistObj['tracks'] = [];
					}
				} else if (line.indexOf('<key>Track ID</key>') > -1) {
					let track = module.exports.buildProperty(line);
					playlistObj['tracks'].push(track['Track ID']);
				} else if (line.indexOf('<key>') > -1) {
					/* ADD A PROPERTY TO THE playlist */
					let newProp = module.exports.buildProperty(line);
					if (!newProp['Playlist Items'])
						(<any>Object).assign(playlistObj, newProp);
				} else if (line.indexOf('</dict>') > -1) {
					dictDepth--;
					if (dictDepth == 0) {
						/* END OF CURRENT playlist */
						if (module.exports.objectIsPlaylist(playlistObj)) {
							playlistCount++;
							streamOut.push(JSON.stringify(playlistObj));
						}
					}
				}
			}
		}
	});

	streamIn.on('end', () => {
		if (playlistCount == 0)
			streamOut.emit('error', 'No playlists exist in the file');
		playlistCount = 0; //reset it
		streamOut.push(null);
	});

	streamIn.on('error', err => {
		streamOut.emit('error', 'Error parsing iTunes XML');
	});

	return streamOut;
}

/**
 * Validates that the file is an itunes XML file.
 *
 * @param  string
 * @return Boolean
 */
export function validPath(librarypath) {
	let extension = path.extname(librarypath);
	if (extension != '.xml') return false;
	return true;
}

/**
 * Ensures we have a music track and not a video or other non-music item.
 *
 * @param  Object
 * @return Boolean
 */
export function objectIsPlaylist(obj) {
	if (obj['Playlist ID']) return true;
	else return false;
}

/**
 * Ensures we have a playlist and not a track, video or other non-playlist item.
 *
 * @param  Object
 * @return Boolean
 */
export function objectIsMusicTrack(obj) {
	if (
		(obj.Name || obj.Artist) &&
		!obj['Playlist ID'] &&
		(obj.Kind == 'MPEG audio file' ||
			obj.Kind == 'AAC audio file' ||
			obj.Kind == 'Matched AAC audio file' ||
			obj.Kind == 'Protected AAC audio file' ||
			obj.Kind == 'Purchased AAC audio file' ||
			obj.Kind == 'Apple Music AAC audio file' ||
			obj.Kind == 'Internet audio stream' ||
			obj.Kind == 'MPEG-4 audio file' ||
			obj.Kind == 'AIFF audio file' ||
			obj.Kind == 'WAV audio file')
	)
		return true;
	else return false;
}

/**
 * Creates a simple object with a key/value pair from the current XML line.
 *
 * @param  String
 * @return Object
 */
export function buildProperty(line) {
	let key = String(line).match('<key>(.*)</key>');
	let value = String(line).match('<integer>(.*)</integer>');
	if (!value) value = String(line).match('<date>(.*)</date>');
	if (!value) value = String(line).match('<string>(.*)</string>');

	let k = '';
	if (key != null && key.length > 1) k = key[1];
	let v = '';
	if (value != null && value.length > 1) v = value[1];
	let o = {};
	o[k] = v;
	return o;
}
