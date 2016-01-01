var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var rewire = require( 'rewire' );

var EventEmitter = require( 'events' ).EventEmitter;

var dispatcher = rewire( '../dispatcher' );

describe( 'dispatcher', function() {

    var fs,
        childProcess,
        output;

    before( function() {
        fs = dispatcher.__get__( 'fs' );
        childProcess = dispatcher.__get__( 'childProcess' );
        output = dispatcher.__get__( 'output' );
    });

    describe( 'generateOutputFile', function() {

        var generateOutputFile,
            initializedRevert,
            outcomeDirectoryRevert,
            outcomeFileRevert,
            statStub,
            mkdirStub,
            writeFileStub,
            passErrorStub;

        before( function() {
            generateOutputFile = dispatcher.__get__( 'generateOutputFile' );
        });

        beforeEach( function() {

            initializedRevert = dispatcher.__set__( 'initialized', false );
            outcomeDirectoryRevert = dispatcher.__set__( 'outcomeDirectory', dispatcher.__get__( 'outcomeDirectory' ) );
            outcomeFileRevert = dispatcher.__set__( 'outcomeFile', dispatcher.__get__( 'outcomeFile' ) );

            statStub = sinon.stub( fs, 'statSync', function( pathFileName ) {
               switch( pathFileName ) {
                   case 'noOutcomeDirectory':
                       throw new Error( 'outcomeDirectory does not exist' );
                       break;
                   case 'noOutcomeFile':
                       throw new Error( 'outcomeFile does not exist' );
                       break;
               };
            });

            mkdirStub = sinon.stub( fs, 'mkdirSync' );

            writeFileStub = sinon.stub( fs, 'writeFile', function( fileName, outcomeMsg, callback ) {
                callback();
            });

            passErrorStub = sinon.stub( output, 'passError', function( err ) {} );

        });

        afterEach( function() {
            initializedRevert();
            outcomeDirectoryRevert();
            outcomeFileRevert();
            statStub.restore();
            mkdirStub.restore();
            writeFileStub.restore();
            passErrorStub.restore();
        });

        it( 'should create the outcomeDirectory if statSync indicates it does not exist via an error', function() {
            outcomeDirectoryRevert = dispatcher.__set__( 'outcomeDirectory', 'noOutcomeDirectory' )  ;
            generateOutputFile();
            expect( statStub.callCount ).to.equal( 2 );
            expect( mkdirStub.callCount ).to.equal( 1 );
        });

        it( 'should skip the outcomeDirectory creation if statSync indicates it exists', function() {
            generateOutputFile();
            expect( statStub.callCount ).to.equal( 2 );
            expect( mkdirStub.callCount ).to.equal( 0 );
        });

        it( 'should skip fs.writeFile if statSync indicates outcomeFile exists', function() {
            generateOutputFile();
            expect( statStub.callCount ).to.equal( 2 );
            expect( writeFileStub.callCount ).to.equal( 0 );
            expect( passErrorStub.callCount ).to.equal( 0 );
        });

        it( 'should execute fs.writeFile and output.passError if statSync indicates outcomeFile does not exist via error', function() {
            outcomeFileRevert = dispatcher.__set__( 'outcomeFile', 'noOutcomeFile' );
            generateOutputFile();
            expect( statStub.callCount ).to.equal( 2 );
            expect( writeFileStub.callCount ).to.equal( 1 );
            expect( writeFileStub.args[ 0 ][ 0 ] ).to.equal( 'noOutcomeFile' );
            expect( writeFileStub.args[ 0 ][ 1 ] ).to.equal( dispatcher.__get__( 'defaultOutcomeMsg' ) );
            expect( passErrorStub.callCount ).to.equal( 1 );
        });

        it( 'should set initialized to true', function() {
            generateOutputFile();
            expect( dispatcher.__get__( 'initialized' ) ).to.equal( true );
        });

    });

    describe( 'spawnCmd', function() {

        var spawnCmd,
            cmdProcessCreatedRevert,
            errorArrayRevert,
            stderr,
            spawnStub,
            watchFileStub,
            readFileStub,
            errorStub,
            msgStub;

        before( function() {
            spawnCmd = dispatcher.__get__( 'spawnCmd' );
        });

        beforeEach( function() {
            cmdProcessCreatedRevert = dispatcher.__set__( 'cmdProcessCreated', false );
            errorArrayRevert = dispatcher.__set__( 'errorArray', [] );

            stderr = new EventEmitter;
            spawnStub = sinon.stub( childProcess, 'spawn', function( cmd ) {
                return { stderr: stderr }
            });

            watchFileStub = sinon.stub( fs, 'watchFile', function( fileName, callback ) {
                callback();
            });

            var cback = function( errMsg, outcomeMsg ) {};
            readFileStub = sinon.stub( fs, 'readFile', function( fileName, cback ) {
                cback();
            });

            errorStub = sinon.stub( output, 'error' );
            msgStub = sinon.stub( output, 'msg' );
        });

        afterEach( function() {
            cmdProcessCreatedRevert();
            errorArrayRevert();
            spawnStub.restore();
            watchFileStub.restore();
            readFileStub.restore();
            errorStub.restore();
            msgStub.restore();
        });

        it( 'will call the spawn() function of child_process', function() {
            spawnCmd();
            expect( spawnStub.callCount ).to.equal( 1 );
        });

        it( 'subscribes to the "data" event of stderr, and acts on event by adding the error message to the errorArray', function() {
            expect( dispatcher.__get__( 'errorArray' ).length ).to.equal( 0 );
            spawnCmd();
            stderr.emit( 'data', 'process errored' );
            expect( dispatcher.__get__( 'errorArray' ).length ).to.equal( 1 );
            expect( dispatcher.__get__( 'errorArray' )[ 0 ] ).to.equal( 'process errored' );
        });

        it( 'sets a watch on the outcomeFile', function() {
            spawnCmd();
            expect( watchFileStub.callCount ).to.equal( 1 );
            expect( watchFileStub.args[ 0 ][ 0 ] ).to.equal( dispatcher.__get__( 'outcomeFile' ) )
        });

        it( 'executes readFile on the outcomeFile', function() {
            spawnCmd();
            expect( readFileStub.callCount ).to.equal( 1 );
            expect( readFileStub.args[ 0 ][ 0 ] ).to.equal( dispatcher.__get__( 'outcomeFile' ) )
        });

        it( 'executes output.error with the message as argument for each item in the errorArray', function() {
            expect( dispatcher.__get__( 'errorArray' ).length ).to.equal( 0 );

            //Have to run spawnCmd once to subscribe to the stderr event
            spawnCmd();

            //Now generate some errors
            stderr.emit( 'data', 'first error' );
            stderr.emit( 'data', 'second error' );

            //Now re-run the command
            spawnCmd();

            expect( dispatcher.__get__( 'errorArray' ).length ).to.equal( 2 );
            expect( watchFileStub.callCount ).to.equal( 2 );
            expect( readFileStub.callCount ).to.equal( 2 );
            expect( errorStub.callCount ).to.equal( 2 );
            expect( errorStub.args[ 0 ][ 0 ] ).to.equal( 'first error' );
            expect( errorStub.args[ 1 ][ 0 ] ).to.equal( 'second error' );
        });

        it( 'executes output.msg once per function execution, regardless of errors, returning the outcome message', function() {
            expect( dispatcher.__get__( 'errorArray' ).length ).to.equal( 0 );

            //Have to run spawnCmd once to subscribe to the stderr event
            spawnCmd();

            //Now generate some errors
            stderr.emit( 'data', 'first error' );
            stderr.emit( 'data', 'second error' );
            stderr.emit( 'data', 'third error' );

            //Now re-run the command
            spawnCmd();

            expect( dispatcher.__get__( 'errorArray' ).length ).to.equal( 3 );
            expect( msgStub.callCount ).to.equal( 2 );
        });

        it( 'will set cmdProcessCreated to true', function() {
            expect( dispatcher.__get__( 'cmdProcessCreated' ) ).to.equal( false );
            spawnCmd();
            expect( dispatcher.__get__( 'cmdProcessCreated' ) ).to.equal( true );
        });

    });

    describe( 'writeOutcome', function() {
        var writeOutcome,
            stdin,
            writeStub,
            terminalRevert;

        before( function() {
            writeOutcome = dispatcher.__get__( 'writeOutcome' );
            stdin = { write: function() {} };
            writeStub = sinon.stub( stdin, 'write' );
            terminalRevert = dispatcher.__set__( 'terminal', { stdin: stdin } );
        });

        after( function() {
            writeStub.restore();
            terminalRevert();
        });

        it( 'creates an echo statement to write the outcomeMsg to the outcomeFile', function() {
            writeOutcome( 'Process completed' );
            expect( writeStub.callCount ).to.equal( 1 );
            expect( writeStub.args[ 0 ][ 0 ] ).to.equal( 'echo Process completed > ' + dispatcher.__get__( 'outcomeFile' ) + '\n' );
        });

    });

    describe( 'dispatch', function() {

        var throwErrorStub,
            initializedRevert,
            cmdProcessRevert,
            generateOutputStub,
            generateOutputFileRevert,
            spawnStub,
            spawnCmdRevert,
            errorArrayRevert,
            writeOutcomeStub,
            writeOutcomeRevert,
            stdin,
            writeStub,
            terminalRevert;

        beforeEach( function() {
            throwErrorStub = sinon.stub( output, 'throwError', function( msg ) { throw new Error( msg ) } );

            initializedRevert = dispatcher.__set__( 'initialized', true );
            cmdProcessRevert = dispatcher.__set__( 'cmdProcessCreated', true );

            generateOutputStub = sinon.stub();
            generateOutputFileRevert = dispatcher.__set__( 'generateOutputFile', generateOutputStub );

            spawnStub = sinon.stub();
            spawnCmdRevert = dispatcher.__set__( 'spawnCmd', spawnStub );

            errorArrayRevert = dispatcher.__set__( 'errorArray', dispatcher.__get__( 'errorArray' ) );

            writeOutcomeStub = sinon.stub();
            writeOutcomeRevert = dispatcher.__set__( 'writeOutcome', writeOutcomeStub );

            stdin = { write: function() {} };
            writeStub = sinon.stub( stdin, 'write' );
            terminalRevert = dispatcher.__set__( 'terminal', { stdin: stdin } );
        });

        afterEach( function() {
            throwErrorStub.restore();
            initializedRevert();
            cmdProcessRevert();
            generateOutputFileRevert();
            spawnCmdRevert();
            errorArrayRevert();
            writeOutcomeRevert();
            writeStub.restore();
            terminalRevert();
            writeStub.restore();
            terminalRevert();
        });

        it( 'should throw an error if cmdArray argument is not defined or not an array', function() {
            expect( function() { dispatcher.dispatch() } ).to.throw( Error, /The first dispatch argument must be an array./ );
            expect( throwErrorStub.callCount ).to.equal( 1 );

            expect( function() { dispatcher.dispatch( 'a string' ) } ).to.throw( Error, /The first dispatch argument must be an array./ );
            expect( throwErrorStub.callCount ).to.equal( 2 );
        });

        it( 'should only execute generateOutputFile() if initialized == false', function() {
            dispatcher.dispatch( [ 'start', 'pause', 'stop' ] );
            expect( generateOutputStub.callCount ).to.equal( 0 );

            initializedRevert = dispatcher.__set__( 'initialized', false );
            dispatcher.dispatch( [ 'start', 'pause', 'stop' ] );
            expect( generateOutputStub.callCount ).to.equal( 1 );
        });

        it( 'should only execute spawnCmd() if cmdProcessCreated == false', function() {
            dispatcher.dispatch( [ 'start', 'pause', 'stop' ] );
            expect( spawnStub.callCount ).to.equal( 0 );

            initializedRevert = dispatcher.__set__( 'cmdProcessCreated', false );
            dispatcher.dispatch( [ 'start', 'pause', 'stop' ] );
            expect( spawnStub.callCount ).to.equal( 1 );
        });

        it( 'should reset the errorsArray', function() {
            errorArrayRevert = dispatcher.__set__( 'errorArray', [ 'error1' ] );
            dispatcher.dispatch( [ 'start', 'pause', 'stop' ] );
            expect( dispatcher.__get__( 'errorArray' ).length ).to.equal( 0 );
        });

        it( 'should invoke terminal.stdin.write once per cmdArray item', function() {
            dispatcher.dispatch( [ 'start', 'pause', 'stop' ] );
            expect( writeStub.callCount ).to.equal( 3 );
            expect( writeStub.args[ 0 ][ 0 ] ).to.equal( 'start\n' );
            expect( writeStub.args[ 2 ][ 0 ] ).to.equal( 'stop\n' );
        });

        it( 'should only invoke writeOutcome if no msg argument', function() {
            dispatcher.dispatch( [ 'start', 'pause', 'stop' ] );
            expect( writeOutcomeStub.callCount ).to.equal( 0 );

            dispatcher.dispatch( [ 'start', 'pause', 'stop' ], 'Command chain finished' );
            expect( writeOutcomeStub.callCount ).to.equal( 1 );
            expect( writeOutcomeStub.args[ 0 ][ 0 ] ).to.equal( 'Command chain finished' );
        });
    });
});
