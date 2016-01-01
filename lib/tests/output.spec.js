var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var rewire = require( 'rewire' );

var output = rewire( '../output' );

describe( 'output', function() {
    var core,
        readlineStub,
        logStub,
        coreRevert;

    before( function() {
        core = output.__get__( 'core' );
        coreRevert = output.__set__( 'core', core );
    });

    beforeEach( function() {
        readlineStub = sinon.stub( core, 'getReadlineInterface', function() {
            return {
                prompt: function( toggle ) {}
            }
        });
        logStub = sinon.stub( console, 'log' );
        coreRevert = output.__set__( 'core', core );
    });

    afterEach( function() {
        logStub.restore();
        readlineStub.restore();
        coreRevert();
    });

    describe( 'throwError', function() {
        it( 'throws an output.OutputError', function() {
            expect( function() { output.throwError( 'Something went wrong' ) } ).to.throw( output.OutputError );
        });

        it( 'OutputError message is prefixed with "\nERROR:" followed by error message, and has expected colors property', function() {
            try {
                output.throwError( 'Something went wrong' );
            } catch ( err ) {
                expect( err.message ).to.equal( "\nERROR: Something went wrong" );
                expect( err.message ).to.have.property( 'red' );
            }
        })
    });

    describe( 'error', function() {
        it( 'adds "\nERROR:" to the error message before passing it to the console', function() {
            output.error( 'That did not go well' );
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.calledWith( '\nERROR: That did not go well' ) ).to.equal( true );
        });

        it( 'executes getReadlineInterface().prompt() by default, unless skipPrompt argument dictates otherwise', function() {
            output.error( 'Not good' );
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.calledWith( '\nERROR: Not good' ) ).to.equal( true );
            expect( readlineStub.callCount ).to.equal( 1 );

            output.error( 'Really not good', true );
            expect( logStub.callCount ).to.equal( 2 );
            expect( logStub.calledWith( '\nERROR: Really not good' ) ).to.equal( true );
            //Unchanged
            expect( readlineStub.callCount ).to.equal( 1 );
        });

        it( 'decorates the string with the expected colors property', function() {
            output.error( 'Not good' );
            expect( logStub.args[ 0 ][ 0 ] ).to.have.property( 'red' );
        });
    });

    describe( 'passError', function() {

        var errorStub;

        beforeEach( function() {
            errorStub = sinon.stub( output, 'error' );
        });

        afterEach( function() {
            errorStub.restore();
        });

        it( 'if there is an error object, passes message of that error down to error() function', function() {
            var errorObject = { message: 'function failed' };
            output.passError( errorObject );
            expect( errorStub.callCount ).to.equal( 1 );
            expect( errorStub.calledWith( 'function failed' ) ).to.equal( true );
        });

        it( 'if there is no error object argument, nothing happens', function() {
            output.passError();
            expect( errorStub.callCount ).to.equal( 0 );
        });
    });

    describe( 'prompt', function() {
        it( 'execute core.getReadlineInterface().prompt()', function() {
            output.prompt();
            expect( readlineStub.callCount ).to.equal( 1 );
        });
    });

    describe( 'msg', function() {
        it( 'adds "\n" to the message before passing it to the console', function() {
            output.msg( 'Something happened' );
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.calledWith( '\nSomething happened' ) ).to.equal( true );
        });

        it( 'executes getReadlineInterface().prompt() by default, unless skipPrompt argument dictates otherwise', function() {
            output.msg( 'Not bad' );
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.calledWith( '\nNot bad' ) ).to.equal( true );
            expect( readlineStub.callCount ).to.equal( 1 );

            output.msg( 'Really not bad', true );
            expect( logStub.callCount ).to.equal( 2 );
            expect( logStub.calledWith( '\nReally not bad' ) ).to.equal( true );
            //Unchanged
            expect( readlineStub.callCount ).to.equal( 1 );
        });

        it( 'decorates the string with the expected colors property', function() {
            output.msg( 'Not bad' );
            expect( logStub.args[ 0 ][ 0 ] ).to.have.property( 'cyan' );
        });

    });

    describe( 'warn', function() {
        it( 'adds "\nWARN:" to the message before passing it to the console', function() {
            output.warn( 'Slight problem' );
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.calledWith( '\nWARN: Slight problem' ) ).to.equal( true );
        });

        it( 'executes getReadlineInterface().prompt() by default, unless skipPrompt argument dictates otherwise', function() {
            output.warn( 'Minor issue' );
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.calledWith( '\nWARN: Minor issue' ) ).to.equal( true );
            expect( readlineStub.callCount ).to.equal( 1 );

            output.warn( 'Just something to check', true );
            expect( logStub.callCount ).to.equal( 2 );
            expect( logStub.calledWith( '\nWARN: Just something to check' ) ).to.equal( true );
            //Unchanged
            expect( readlineStub.callCount ).to.equal( 1 );
        });

        it( 'decorates the string with the expected colors property', function() {
            output.warn( 'Minor issue' );
            expect( logStub.args[ 0 ][ 0 ] ).to.have.property( 'yellow' );
        });
    });

    describe( 'success', function() {
        it( 'adds "\n" to the message before passing it to the console, and always executes getReadlineInterface().prompt()', function() {
            output.success( 'It worked!' );
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.calledWith( '\nIt worked!' ) ).to.equal( true );
        });

        it( 'decorates the string with the expected colors property', function() {
            output.success( 'It worked!' );
            expect( logStub.args[ 0 ][ 0 ] ).to.have.property( 'green' );
        });

    });

});