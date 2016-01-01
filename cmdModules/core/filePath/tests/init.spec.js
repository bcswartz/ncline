var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var rewire = require( 'rewire' );

var init = rewire( '../init' );

describe( 'init functions', function() {

    var fs,
        output,
        data,
        createDataFile;

    before( function() {
        //Retrieve the required modules
        fs = init.__get__( 'fs' );
        output = init.__get__( 'output' );
        createDataFile = init.__get__( 'createDataFile' );
    });

    describe( 'createDataFile', function() {

        var statSyncStub,
            mkdirSyncStub,
            passErrorStub,
            writeFileStub,
            fakeData = {},
            dataRevert,
            dataDirectoryRevert,
            fsRevert,
            outputRevert;

        beforeEach( function() {
            statSyncStub = sinon.stub( fs, 'statSync', function( dataDirectory ) {
                switch( dataDirectory ) {
                    case 'C:\\errorDirectory':
                        throw new Error( 'notFound' );
                        break;
                    case 'C:\\directoryExists':
                        break;
                }
            });

            mkdirSyncStub = sinon.stub( fs, 'mkdirSync', function( dataDirectory ) { return true; } );
            passErrorStub = sinon.stub( output, 'passError', function() {} );
            writeFileStub = sinon.stub( fs, 'writeFile', function( fileName, dataString, callback ) {
                fakeData.fileName = fileName;
                fakeData.initialDataString = dataString;
                callback();
            });

            dataRevert = init.__set__( 'data', fakeData );
            dataDirectoryRevert = init.__set__( 'dataDirectory', 'C:\\directoryExists' );
            fsRevert = init.__set__( 'fs', fs );
            outputRevert = init.__set__( 'output', output );
        });

        afterEach( function() {
            statSyncStub.restore();
            mkdirSyncStub.restore();
            passErrorStub.restore();
            writeFileStub.restore();

            dataRevert();
            dataDirectoryRevert();
            fsRevert();
            outputRevert();
        })

        it( 'should execute fs.mkdirSync if fs.statSync returns an error', function() {
            dataDirectoryRevert = init.__set__( 'dataDirectory', 'C:\\errorDirectory' );

            createDataFile();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( mkdirSyncStub.callCount ).to.equal( 1 );
        });

        it( 'should not execute fs.mkdirSync if fs.statSync does not throw an error', function() {
            createDataFile();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( mkdirSyncStub.callCount ).to.equal( 0 );
        });

        it( 'should provide fs.writeFile with the filename, which combines normal dataDirectory with "data.json"', function() {
            createDataFile();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( mkdirSyncStub.callCount ).to.equal( 0 );

            var dataResult = init.__get__( 'data' );
            expect( dataResult.fileName ).to.equal( './cmdData/filePath/data.json' );

        });

        it( 'should provide fs.writeFile with stringified version of initialData', function() {
            createDataFile();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( mkdirSyncStub.callCount ).to.equal( 0 );

            var dataResult = init.__get__( 'data' );
            expect( dataResult.initialDataString ).to.contain( 'verbose' );
            expect( dataResult.initialDataString ).to.contain( '"alias": "self"' );
        });

        it( 'should execute output.passError in its callback', function() {
            createDataFile();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( mkdirSyncStub.callCount ).to.equal( 0 );
            expect( passErrorStub.callCount ).to.equal( 1 );
        });

    });

    describe( 'execute', function() {

        var statSyncStub,
            readFileStub,
            fsRevert,
            dataFileRevert,
            createDataFileStub,
            createDataFileRevert;

        beforeEach( function() {
            statSyncStub = sinon.stub( fs, 'statSync', function( dataFile ) {
                switch( dataFile ) {
                    case 'createError.json':
                        throw new Error( 'notFound' );
                        break;
                    case 'fileExists.json':
                        break;
                }
            });

            readFileStub = sinon.stub( fs, 'readFileSync', function( dataFile ) {
                //Must return a string that can be parsed into JSON
                return '{"verbose":false,"target":{"alias":"fromFile","path":"C:\\filePath"}}';
            });

            fsRevert = init.__set__( 'fs', fs );
            dataFileRevert = init.__set__( 'dataFile', 'fileExists.json' );
            createDataFileStub = sinon.stub().returns( true );
            createDataFileRevert = init.__set__( 'createDataFile', createDataFileStub );
        });

        afterEach( function() {
            statSyncStub.restore();
            readFileStub.restore();

            fsRevert();
            dataFileRevert();
            createDataFileRevert();
        });

        it( 'should execute statSync on the data file', function() {
            init.execute();
            expect( statSyncStub.callCount ).to.equal( 1 );
        });

        it( 'should read the file data into the data variable if the data file exists', function () {
            init.execute();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( readFileStub.callCount ).to.equal( 1 );

            var dataResult = init.__get__( 'data' );
            expect( dataResult.verbose ).to.equal( false );
            expect( dataResult.target.alias ).to.equal( 'fromFile' );
        });

        it( 'should execute createDataFile() if statSync errors on the file', function() {
            dataFileRevert = init.__set__( 'dataFile', 'createError.json' );
            init.execute();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( readFileStub.callCount ).to.equal( 0 );
            expect( createDataFileStub.callCount ).to.equal( 1 );
        });

        it( 'should set the data variable to the initial data if createDataFile() is executed', function() {
            dataFileRevert = init.__set__( 'dataFile', 'createError.json' );
            init.execute();

            expect( statSyncStub.callCount ).to.equal( 1 );
            expect( readFileStub.callCount ).to.equal( 0 );
            expect( createDataFileStub.callCount ).to.equal( 1 );

            var dataResult = init.__get__( 'data' );
            expect( dataResult.verbose ).to.equal( false );
            expect( dataResult.target.alias ).to.equal( 'self' );
        });
    });

    describe( 'getData', function() {

        var dataRevert;

        before( function() {
            dataRevert = init.__set__( 'data', { testProperty: 'present' } );
        });

        after( function() {
            dataRevert();
        });

        it( 'should return the data variable', function() {
            var data = init.getData();
            expect( data ).to.have.property( 'testProperty' );
            expect( data.testProperty ).to.equal( 'present' );
        });
    });

    describe( 'getConfig', function() {

        var dataFileRevert;

        before( function() {
            dataFileRevert = init.__set__( 'dataFile', 'C:\\dataFolder\dataFile.json' );
        });

        after( function() {
            dataFileRevert();
        });

        it( 'should return an object with the name of the data file', function() {
            var config = init.getConfig();
            expect( config ).to.have.property( 'dataFile' );
            expect( config.dataFile ).to.equal( 'C:\\dataFolder\dataFile.json' );
        });
    });


});