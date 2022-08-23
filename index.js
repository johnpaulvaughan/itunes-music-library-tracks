"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProperty = exports.objectIsMusicTrack = exports.objectIsPlaylist = exports.validPath = exports.getItunesPlaylists = exports.getItunesTracks = void 0;
var path = require("path");
var fs = require("fs");
var stream_1 = require("stream");
var byline = require('byline');
/**
 * Creates an stream of JSON tracks from an iTunes Library XML file.
 *
 * @param  String
 * @return ReadableStream of JSON objects
 */
function getItunesTracks(librarypath) {
    var libraryID;
    var trackObj = {};
    var isTrack = false;
    var line;
    var trackCount = 0;
    var streamIn;
    var streamOut = new stream_1.Readable();
    streamOut._read = function () {
        /* needed this stub to fix init issues */
    };
    streamIn = fs.createReadStream(librarypath);
    streamIn.on('error', function () {
        return streamOut.emit('error', 'The file you selected does not exist');
    });
    streamIn = byline.createStream(streamIn);
    /*
    if (!module.exports.validPath(librarypath)) {
        streamOut.emit("error", 'Not a valid XML file')
    }
    */
    streamIn.on('readable', function () {
        while (null !== (line = streamIn.read())) {
            if (line.indexOf('<key>Library Persistent ID</key>') > -1) {
                /* ADD A KEY/VALUE PROPERTY */
                var iDString = String(line).match('<key>Library Persistent ID</key><string>(.*)</string>');
                libraryID = iDString[1];
            }
            else if (line.indexOf('<dict>') > -1) {
                /* START A NEW TRACK */
                trackObj = {};
                isTrack = true;
            }
            else if (line.indexOf('<key>') > -1) {
                /* ADD A PROPERTY TO THE TRACK */
                Object.assign(trackObj, module.exports.buildProperty(line));
            }
            else if (line.indexOf('</dict>') > -1) {
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
    streamIn.on('end', function () {
        if (trackCount == 0)
            streamOut.emit('error', 'No tracks exist in the file');
        trackCount = 0; //reset it
        streamOut.push(null);
    });
    streamIn.on('error', function (err) {
        streamOut.emit('error', 'Error parsing iTunes XML');
    });
    return streamOut;
}
exports.getItunesTracks = getItunesTracks;
/**
 * Creates an stream of JSON playlists from an iTunes Library XML file.
 *
 * @param  String
 * @return ReadableStream of JSON objects
 */
function getItunesPlaylists(librarypath) {
    var libraryID;
    var reachedPlaylistCollection = false;
    var playlistObj = {};
    var isPlaylist = false;
    var line;
    var playlistCount = 0;
    var dictDepth = 0;
    var streamIn;
    var streamOut = new stream_1.Readable();
    streamOut._read = function () {
        /* needed this stub to fix init issues */
    };
    streamIn = fs.createReadStream(librarypath);
    streamIn.on('error', function () {
        return streamOut.emit('error', 'The file you selected does not exist');
    });
    streamIn = byline.createStream(streamIn);
    streamIn.on('readable', function () {
        while (null !== (line = streamIn.read())) {
            if (!reachedPlaylistCollection) {
                if (line.indexOf('<key>Playlists</key>') > -1)
                    reachedPlaylistCollection = true;
            }
            else {
                if (line.indexOf('<dict>') > -1) {
                    dictDepth++;
                    if (dictDepth == 1) {
                        /* START A NEW playlist */
                        playlistObj = {};
                        playlistObj['tracks'] = [];
                    }
                }
                else if (line.indexOf('<key>Track ID</key>') > -1) {
                    var track = module.exports.buildProperty(line);
                    playlistObj['tracks'].push(track['Track ID']);
                }
                else if (line.indexOf('<key>') > -1) {
                    /* ADD A PROPERTY TO THE playlist */
                    var newProp = module.exports.buildProperty(line);
                    if (!newProp['Playlist Items'])
                        Object.assign(playlistObj, newProp);
                }
                else if (line.indexOf('</dict>') > -1) {
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
    streamIn.on('end', function () {
        if (playlistCount == 0)
            streamOut.emit('error', 'No playlists exist in the file');
        playlistCount = 0; //reset it
        streamOut.push(null);
    });
    streamIn.on('error', function (err) {
        streamOut.emit('error', 'Error parsing iTunes XML');
    });
    return streamOut;
}
exports.getItunesPlaylists = getItunesPlaylists;
/**
 * Validates that the file is an itunes XML file.
 *
 * @param  string
 * @return Boolean
 */
function validPath(librarypath) {
    var extension = path.extname(librarypath);
    if (extension != '.xml')
        return false;
    return true;
}
exports.validPath = validPath;
/**
 * Ensures we have a music track and not a video or other non-music item.
 *
 * @param  Object
 * @return Boolean
 */
function objectIsPlaylist(obj) {
    if (obj['Playlist ID'])
        return true;
    else
        return false;
}
exports.objectIsPlaylist = objectIsPlaylist;
/**
 * Ensures we have a playlist and not a track, video or other non-playlist item.
 *
 * @param  Object
 * @return Boolean
 */
function objectIsMusicTrack(obj) {
    if ((obj.Name || obj.Artist) &&
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
            obj.Kind == 'WAV audio file'))
        return true;
    else
        return false;
}
exports.objectIsMusicTrack = objectIsMusicTrack;
/**
 * Creates a simple object with a key/value pair from the current XML line.
 *
 * @param  String
 * @return Object
 */
function buildProperty(line) {
    var key = String(line).match('<key>(.*)</key>');
    var value = String(line).match('<integer>(.*)</integer>');
    if (!value)
        value = String(line).match('<date>(.*)</date>');
    if (!value)
        value = String(line).match('<string>(.*)</string>');
    var k = '';
    if (key != null && key.length > 1)
        k = key[1];
    var v = '';
    if (value != null && value.length > 1)
        v = value[1];
    var o = {};
    o[k] = v;
    return o;
}
exports.buildProperty = buildProperty;
//# sourceMappingURL=index.js.map