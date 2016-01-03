var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );


describe( 'cmdManager commands', function() {
    var core,
        output,
        cmds;

    before( function() {
        core = sinon.stub();
        output = sinon.stub();

        commands = proxyquire( '../commands', {
            '../../../lib/core': core,
            '../../../lib/output': output
        });

        cmds = {
            createAlias: {
                signature: 'createAlias( alias, filepath )',
                modulePath: 'core/filePath',
                manual: {
                    description: 'Creates file alias',
                    arguments: {
                        alias: 'Name of the alias',
                        filepath: 'Absolute file path',
                    },
                    examples: [
                        'Example 1',
                        'Example 2'
                    ]
                }
            },
            showCmds: {
                signature: 'showCmds()',
                modulePath: 'core/cmdManager'
            }
        };
    });

    //Manage global stubs
    var sortPropsStub,
        getCmdObjectStub,
        logStub,
        throwErrorStub;

    beforeEach( function() {

        getCmdObjectStub = sinon.stub( core, 'getCmdObject', function() { return cmds } );
        sortPropsStub = sinon.stub( core, 'sortObjectProperties', function( cmdObject ) { return cmdObject } );
        logStub = sinon.stub( console, 'log' );
        throwErrorStub = sinon.stub( output, "throwError", function( msg ) { throw new Error( msg ) } );
    });

    afterEach( function() {
        getCmdObjectStub.restore();
        sortPropsStub.restore();
        logStub.restore();
        throwErrorStub.restore();
    });

    describe( 'showCmds', function() {
        it( 'should execute core.sortObjectProperties and core.getCmdObject', function() {
            commands.showCmds();

            expect( sortPropsStub.callCount ).to.equal( 1 );
            expect( getCmdObjectStub.callCount ).to.equal( 1 );
        });

        it( 'should output a title line', function() {
            commands.showCmds();

            expect( sortPropsStub.callCount ).to.equal( 1 );
            expect( getCmdObjectStub.callCount ).to.equal( 1 );

            expect( logStub.args.length ).to.equal( 3 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Available commands:' );
        });

        it( 'should output one command signature per line', function() {
            commands.showCmds();

            expect( sortPropsStub.callCount ).to.equal( 1 );
            expect( getCmdObjectStub.callCount ).to.equal( 1 );

            expect( logStub.args.length ).to.equal( 3 );
            expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'createAlias( alias, filepath )' );
            expect( logStub.args[ 2 ][ 0 ] ).to.equal( 'showCmds()' );
        });


    });

    describe( 'man', function() {
        describe( 'under failure conditions', function () {

            it( 'should execute output.throwError if no cmdName arguments', function() {
                expect( function() { commands.man() } ).to.throw( Error, /You must provide the name of a command/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                //Should throw error before calling core.getCmdObject
                expect( getCmdObjectStub.callCount ).to.equal( 0 );
            });

            it( 'should execute output.throwError if command not found under name', function() {
                expect( function() { commands.man( 'notThere' ) } ).to.throw( Error, /Command not found/ );
                expect( getCmdObjectStub.callCount ).to.equal( 1 );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

        });

        describe( 'under success conditions', function () {

            it( 'should start output with signature and function location', function() {
                commands.man( 'showCmds' );
                expect( getCmdObjectStub.callCount ).to.equal( 1 );
                expect( logStub.args.length ).to.equal( 4 );
                expect( logStub.args[ 0 ][ 0 ] ).to.equal( '' );
                expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'showCmds()' );
                expect( logStub.args[ 2 ][ 0 ] ).to.equal( '(Location: core/cmdManager/commands.js)\n' );
            });

            it( 'should show canned text if no manual information provided', function() {
                commands.man( 'showCmds' );
                expect( getCmdObjectStub.callCount ).to.equal( 1 );
                expect( logStub.args.length ).to.equal( 4 );
                expect( logStub.args[ 3 ][ 0 ] ).to.equal( 'No manual documentation provided; look at the function code for possible comment-based documentation.\n' );
            });

            it( 'should show any manual string property as a single line with a line break', function() {
                commands.man( 'createAlias' );
                expect( getCmdObjectStub.callCount ).to.equal( 1 );
                expect( logStub.args.length ).to.equal( 17 );
                expect( logStub.args[ 5 ][ 0 ] ).to.equal( 'Creates file alias\n' );
            });

            it( 'should capitalize all manual key names and follow them with an underline line', function() {
                commands.man( 'createAlias' );
                expect( getCmdObjectStub.callCount ).to.equal( 1 );
                expect( logStub.args[ 3 ][ 0 ] ).to.equal( 'Description:' );
                expect( logStub.args[ 4 ][ 0 ] ).to.equal( '------------' );
                expect( logStub.args[ 6 ][ 0 ] ).to.equal( 'Arguments:' );
                expect( logStub.args[ 7 ][ 0 ] ).to.equal( '----------' );
                expect( logStub.args[ 12 ][ 0 ] ).to.equal( 'Examples:' );
                expect( logStub.args[ 13 ][ 0 ] ).to.equal( '---------' );
            });

            it( 'should show any manual object property with key/values on different lines', function() {
                commands.man( 'createAlias' );
                expect( getCmdObjectStub.callCount ).to.equal( 1 );
                expect( logStub.args[ 8 ][ 0 ] ).to.equal( 'alias:' );
                expect( logStub.args[ 9 ][ 0 ] ).to.equal( 'Name of the alias\n' );
                expect( logStub.args[ 10 ][ 0 ] ).to.equal( 'filepath:' );
                expect( logStub.args[ 11 ][ 0 ] ).to.equal( 'Absolute file path\n' );
            });

            it( 'should show any manual array property as multiple lines', function() {
                commands.man( 'createAlias' );
                expect( getCmdObjectStub.callCount ).to.equal( 1 );
                expect( logStub.args[ 14 ][ 0 ] ).to.equal( 'Example 1' );
                expect( logStub.args[ 15 ][ 0 ] ).to.equal( 'Example 2' );
            });

        });
    });

    describe( 'about', function() {

        it( 'should execute console.log to provide instructions', function() {
            commands.about();
            expect( logStub.args.length ).to.equal( 11 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( '' );
        })
    });
});