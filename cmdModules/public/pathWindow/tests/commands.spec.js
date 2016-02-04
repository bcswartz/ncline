var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

describe( 'pathWindow commands', function() {
    var childProcess,
        os,
        output,
        fp,
        commands;

    before( function() {
        //Set stubs
        childProcess = sinon.stub();
        os = sinon.stub();
        output = sinon.stub();
        fp = sinon.stub();

        commands = proxyquire( '../commands', {
            'child_process': childProcess,
            'os': os,
            '../../../lib/output': output,
            '../../core/filePath/commands': fp
        } ).commands;
    });

    var osPlatformStub,
        targetAliasStub,
        getAliasStub,
        passErrorStub,
        execStub;

    beforeEach( function() {
        osPlatformStub = sinon.stub( os, 'platform', function() { return 'win32' } );
        targetAliasStub = sinon.stub( fp.hooks, 'getTargetAlias', function() { return 'targetAlias' } );
        getAliasStub = sinon.stub( fp.hooks, 'getAlias', function( aliasName ) {
            switch( aliasName ) {
                case 'targetAlias':
                    return 'C:\\targetPath';
                    break;
                case 'singleAlias':
                    return 'D:\\singleAliasPath';
                    break;
                case 'aliasSet':
                    return [ 'E:\\aliasPathA', 'F:\\aliasPathB' ];
                    break;
            }
        });
        passErrorStub = sinon.stub( output, 'passError' );
        execStub = sinon.stub( childProcess, 'exec', function( statement, callback ) { callback(); } )
    });

    afterEach( function() {
        osPlatformStub.restore();
        targetAliasStub.restore();
        getAliasStub.restore();
        passErrorStub.restore();
        execStub.restore();
    });

    describe( 'window', function() {
        it( 'does not execute fp.getTargetAlias() if alias provided', function() {
            commands.window( 'singleAlias' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
        });

        it( 'executes fp.getTargetAlias() if no alias provided and returns statement with target alias path', function() {
            commands.window() ;
            expect( targetAliasStub.callCount ).to.equal( 1 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( execStub.callCount ).to.equal( 1 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "" "C:\\targetPath"' );

            expect( passErrorStub.callCount ).to.equal( 1 );
        });

        it( 'returns single statement with specified alias path when single alias requested', function() {
            commands.window( 'singleAlias' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( execStub.callCount ).to.equal( 1 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "" "D:\\singleAliasPath"' );

            expect( passErrorStub.callCount ).to.equal( 1 );
        });

        it( 'returns multiple statements with different paths when alias set requested', function() {
            commands.window( 'aliasSet' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( execStub.callCount ).to.equal( 2 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "" "E:\\aliasPathA"' );
            expect( execStub.args[ 1 ][ 0 ] ).to.equal( 'start "" "F:\\aliasPathB"' );

            expect( passErrorStub.callCount ).to.equal( 2 );
        });

    })
});