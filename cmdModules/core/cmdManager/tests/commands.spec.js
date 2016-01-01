var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );


describe( 'cmdManager commands', function() {
    var core,
        cmds;

    before( function() {
        core = sinon.stub();

        commands = proxyquire( '../commands', {
            '../../../lib/core': core
        });

        cmds = {
            createAlias: { signature: 'createAlias( alias, filepath )' },
            showCmds: { signature: 'showCmds()' }
        };
    });

    //Manage global stubs
    var sortPropsStub,
        getCmdObjectStub,
        logStub;

    beforeEach( function() {
        getCmdObjectStub = sinon.stub( core, 'getCmdObject', function() { return cmds } );
        sortPropsStub = sinon.stub( core, 'sortObjectProperties', function( cmdObject ) { return cmdObject } );
        logStub = sinon.stub( console, 'log' );
    });

    afterEach( function() {
        getCmdObjectStub.restore();
        sortPropsStub.restore();
        logStub.restore();
    });

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