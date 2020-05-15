const getItunesPlaylists = require('../index').getItunesPlaylists


async function example() {

    console.log('Example of how the getItunesPlaylists function works!')

    let validXML = "C:\\Users\\JohnPaul\\Music\\iTunes\\iTunes Music Library.xml" //replace this with your xml path

    return new Promise(function(resolve, reject) {

        let stream = getItunesPlaylists(validXML)
        stream.on('data', function(res) {
            let playlist = JSON.parse(res)

            if (playlist['Name'].startsWith("sing")) {
                //do something with a playlist whose name starts with 'sing'
                console.log(playlist)
            }

        })
        stream.on('error', function(err) {
            console.error(err)
            return reject()
        })
        stream.on('end', function(res) {
            return resolve()
        })
        
    })

}


example()
    .then(res => {
        console.log('finished!!!')
    })