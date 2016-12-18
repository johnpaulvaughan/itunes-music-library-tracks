"use strict";
var fs = require('fs');
var stream_1 = require('stream');
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
    var streamIn;
    var streamOut = new stream_1.Readable;
    streamOut._read = function () { };
    streamIn = fs.createReadStream(librarypath);
    streamIn = byline.createStream(streamIn);
    streamIn.on('readable', function () {
        while (null !== (line = streamIn.read())) {
            if (line.indexOf("<key>Library Persistent ID</key>") > -1) {
                /*
                ADD A KEY/VALUE PROPERTY
                */
                var iDString = String(line).match("<key>Library Persistent ID</key><string>(.*)</string>");
                libraryID = iDString[1];
            }
            else if (line.indexOf("<dict>") > -1) {
                /*
                START A NEW TRACK
                */
                trackObj = {};
                isTrack = true;
            }
            else if (line.indexOf("</dict>") > -1) {
                /*
                END OF CURRENT TRACK
                */
                if (module.exports.objectIsMusicTrack(trackObj)) {
                    console.log("built track \"" + trackObj.Name + "\" by \"" + trackObj.Artist + "\"");
                    trackObj['Library Persistent ID'] = libraryID; //add extra metadata
                    //event.sender.send('ITUNES_TRACK', trackObj) //push it to the track stream
                    //console.log(trackObj)
                    streamOut.push(JSON.stringify(trackObj));
                }
                isTrack = false;
            }
            else if (line.indexOf("<key>") > -1) {
                /*
                ADD A KEY/VALUE PROPERTY
                */
                Object.assign(trackObj, module.exports.buildProperty(line));
            }
        }
    });
    streamIn.on('end', function () {
        console.log('xml stream has ended');
        streamOut.push(null);
    });
    streamIn.on('error', function (err) {
        console.log('stream error: ' + err);
        streamOut.push(null);
    });
    return streamOut;
}
exports.getItunesTracks = getItunesTracks;
/**
 * Ensures we have a music track and not a video or other non-music item.
 *
 * @param  Object
 * @return Boolean
 */
function objectIsMusicTrack(obj) {
    if ((obj.Name || obj.Artist)
        && !obj['Playlist ID']
        && (obj.Kind ==
            ('MPEG audio file'
                || 'AAC audio file'
                || 'Matched AAC audio file'
                || 'Protected AAC audio file'
                || 'Purchased AAC audio file')))
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
    var key = String(line).match("<key>(.*)</key>");
    var value = String(line).match("<integer>(.*)</integer>");
    if (!value)
        value = String(line).match("<date>(.*)</date>");
    if (!value)
        value = String(line).match("<string>(.*)</string>");
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