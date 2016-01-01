var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

describe( 'pathTerminal commands', function() {
    var childProcess,
        os,
        output,
        core,
        fp;

    before( function() {
        //Set stubs
        childProcess = sinon.stub();
        os = sinon.stub();
        output = sinon.stub();
        core = sinon.stub();
        fp = sinon.stub();

        commands = proxyquire( '../commands', {
            'child_process': childProcess,
            'os': os,
            '../../../lib/output': output,
            '../../../lib/core': core,
            '../../core/filePath/commands': fp
        });
    });

    var osPlatformStub,
        targetAliasStub,
        getAliasStub,
        prefixStub,
        passErrorStub,
        execStub;

    beforeEach( function() {
        osPlatformStub = sinon.stub( os, 'platform', function() { return 'win32' } );
        targetAliasStub = sinon.stub( fp, 'getTargetAlias', function() { return 'targetAlias' } );
        getAliasStub = sinon.stub( fp, 'getAlias', function( aliasName ) {
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

        prefixStub = sinon.stub( core, 'createTerminalExecutionPrefix', function( filepath, termAlias ) { return filepath + ': "' + termAlias } );
        passErrorStub = sinon.stub( output, 'passError' );

        execStub = sinon.stub( childProcess, 'exec', function( statement, callback ) { callback(); } )
    });

    afterEach( function() {
        osPlatformStub.restore();
        targetAliasStub.restore();
        getAliasStub.restore();
        prefixStub.restore();
        passErrorStub.restore();
        execStub.restore();
    });

    describe( 'term', function() {
        it( 'does not execute fp.getTargetAlias() if alias provided', function() {
            commands.term( 'singleAlias' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
        });

        it( 'executes fp.getTargetAlias() if no alias provided and returns statement with target alias path', function() {
            commands.term() ;
            expect( targetAliasStub.callCount ).to.equal( 1 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( execStub.callCount ).to.equal( 1 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'C:\\targetPath: "targetAlias"' );

            expect( passErrorStub.callCount ).to.equal( 1 );
        });

        it( 'returns single statement with specified alias path when single alias requested', function() {
            commands.term( 'singleAlias' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( execStub.callCount ).to.equal( 1 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'D:\\singleAliasPath: "singleAlias"' );

            expect( passErrorStub.callCount ).to.equal( 1 );
        });

        it( 'returns multiple statements with different paths when alias set requested', function() {
            commands.term( 'aliasSet' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
            expect( getAliasStub.callCount ).to.equal( 1 );

            expect( execStub.callCount ).to.equal( 2 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'E:\\aliasPathA: "aliasSet"' );
            expect( execStub.args[ 1 ][ 0 ] ).to.equal( 'F:\\aliasPathB: "aliasSet"' );

            expect( passErrorStub.callCount ).to.equal( 2 );
        });

    })
});