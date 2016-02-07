var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

describe( 'pathWindow commands', function() {
    var childProcess,
        os,
        output,
        fp,
        exports,
        commands,
        hooks;

    before( function() {
        //Set stubs
        childProcess = sinon.stub();
        os = sinon.stub();
        output = sinon.stub();
        fp = sinon.stub();

        exports = proxyquire( '../commands', {
            'child_process': childProcess,
            'os': os,
            '../../../lib/output': output,
            '../../core/filePath/commands': fp
        } );

        commands = exports.commands;
        hooks = exports.hooks;
    });

    var osPlatformStub,
        targetAliasStub,
        getAliasStub,
        passErrorStub,
        execStub;

    beforeEach( function() {
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
        targetAliasStub.restore();
        getAliasStub.restore();
        passErrorStub.restore();
        execStub.restore();
    });

    describe( 'window', function() {

        var osPlatformStub,
            windowCommandStub;

        beforeEach( function() {
            osPlatformStub = sinon.stub( os, 'platform', function() { return 'win32' } );
            windowCommandStub = sinon.stub( hooks, 'generateFolderWindowCommand', function( filepath ) { return 'start "" "' + filepath + '"'; } );
        });

        afterEach( function() {
            osPlatformStub.restore();
            windowCommandStub.restore();
        });

        it( 'does not execute fp.getTargetAlias() if alias provided', function() {
            commands.window( 'singleAlias' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
        });

        it( 'executes fp.getTargetAlias() if no alias provided and returns statement with target alias path', function() {
            commands.window() ;
            expect( targetAliasStub.callCount ).to.equal( 1 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( windowCommandStub.callCount ).to.equal( 1 );
            expect( execStub.callCount ).to.equal( 1 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "" "C:\\targetPath"' );

            expect( passErrorStub.callCount ).to.equal( 1 );
        });

        it( 'returns single statement with specified alias path when single alias requested', function() {
            commands.window( 'singleAlias' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( windowCommandStub.callCount ).to.equal( 1 );
            expect( execStub.callCount ).to.equal( 1 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "" "D:\\singleAliasPath"' );

            expect( passErrorStub.callCount ).to.equal( 1 );
        });

        it( 'returns multiple statements with different paths when alias set requested', function() {
            commands.window( 'aliasSet' ) ;
            expect( targetAliasStub.callCount ).to.equal( 0 );
            expect( getAliasStub.callCount ).to.equal( 1 );
            expect( windowCommandStub.callCount ).to.equal( 2 );
            expect( execStub.callCount ).to.equal( 2 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "" "E:\\aliasPathA"' );
            expect( execStub.args[ 1 ][ 0 ] ).to.equal( 'start "" "F:\\aliasPathB"' );

            expect( passErrorStub.callCount ).to.equal( 2 );
        });

    });

    describe( 'generateFolderWindowCommand', function() {
        var osPlatformStub,
            throwErrorStub;

        beforeEach( function() {
            throwErrorStub = sinon.stub( output, "throwError", function( msg ) { throw new Error( msg ) } );
        })

        afterEach( function() {
            osPlatformStub.restore();
            throwErrorStub.restore();
        });

        describe( 'when os.platform returns "win32"', function() {
            beforeEach( function() {
                osPlatformStub = sinon.stub( os, 'platform', function() { return 'win32' } );
            });

            it( 'should return a statement starting with "start" and an empty title', function() {
                var result = hooks.generateFolderWindowCommand( 'C:\\Windows' );
                expect( result ).to.match( /^start ""/ );
            });

            it( 'should include the filepath in double-quotes', function() {
                var result = hooks.generateFolderWindowCommand( 'C:\\Windows' );
                expect( result ).to.equal( 'start "" "C:\\Windows"' );
            });
        });

        describe( 'when os.platform returns "darwin"', function() {
            beforeEach( function() {
                osPlatformStub = sinon.stub( os, 'platform', function() { return 'darwin' } );
            });

            it( 'should return a statement starting with "open -a Finder"', function() {
                var result = hooks.generateFolderWindowCommand( '/Users/Bob/Documents' );
                expect( result ).to.match( /^open \-a Finder/ );
            });

            it( 'should include the filepath in double-quotes', function() {
                var result = hooks.generateFolderWindowCommand( '/Users/Bob/Documents' );
                expect( result ).to.equal( 'open -a Finder "/Users/Bob/Documents"' );
            });
        });

        describe( 'when os.platform returns something other than "win32" or "darwin"', function() {
            beforeEach( function() {
                osPlatformStub = sinon.stub( os, 'platform', function() { return 'linux' } );
            });

            it( 'should return an error message', function() {
                expect( function() { hooks.generateFolderWindowCommand( 'C:\\filePath' ) } ).to.throw( Error, /Currently only executes on Windows and Macintosh operating systems./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });
    });
});