var chai = require('chai');
var expect = require('chai').expect;
var should = require('chai').should;
var getItunesTracks = require('../index').getItunesTracks;




describe('#getItunesTracks', () => {
    it('should return a stream', (done) => {
        
        let count = 0

        let validXML = require('path').basename(__dirname) + "/iTunes Library.xml";

        let stream = getItunesTracks(validXML)
        //stream._read = function() {}
        stream.on('data', function(track) {
            console.log(JSON.parse(track))

        })

        stream.on('end', () => {
            console.log('test stream has ended')
            done()
        })


        stream.on('error', (err) => {
            console.log('stream error: ' + err)
            done()
        })


                /*
                      stream.on('end', function () {
                        //assert.equal(5, customers.length);
                        //assert.equal('drew', customers[0].name);
                        //assert.equal(3, api.getCallCount());

                        done();
                      });
                */



    }).timeout(50000);

    /*
        it('should reject with Error:"File does not exist" if the xml is not accessible', () => {
            let nonExistentXML = require('path').basename(__dirname) + "/fake-File-Does-Not-Exist.xml.xml"
;            return expect(getID(nonExistentXML)).to.be.rejectedWith('XML file does not exist')
        })

        it('should reject with Error:"unable to find ID" if it cannot find the ID', () => {
            let fakeXML = require('path').basename(__dirname) + "/not an iTunes Library.xml";
            return expect(getID(fakeXML)).to.be.rejectedWith('Unable to find the iTunes library ID. Check the XML is valid')
        })
        */
});
