var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

describe( 'pathWindow commands', function() {
    var childProcess,
        fs,
        os,
        output,
        fp,
        commands;

    before( function() {
        //Set stubs and mocks
        childProcess = sinon.stub();
        fs = sinon.stub();
        os = { platform: function() { return 'win32' } };
        output = sinon.stub();
        fp = sinon.stub();

        commands = proxyquire( '../commands', {
            'child_process': childProcess,
            'os': os,
            'fs': fs,
            '../../../lib/output': output,
            '../../core/filePath/commands': fp
        } ).commands;
    });

    var throwErrorStub,
        targetPathStub,
        getAliasStub,
        passErrorStub,
        execStub;

    beforeEach( function() {
        throwErrorStub = sinon.stub( output, "throwError", function( msg ) { throw new Error( msg ) } );
        targetPathStub = sinon.stub( fp.hooks, 'getTargetPath', function() { return 'E:\\targetPath' } );
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
        throwErrorStub.restore();
        targetPathStub.restore();
        getAliasStub.restore();
        passErrorStub.restore();
        execStub.restore();
    });

    describe( 'note', function() {

        describe( 'under failure conditions', function() {
            it( 'should throw an error if no filename is provided', function() {
                expect( function() { commands.note() } ).to.throw( Error, /You must provide a filename./ );
                expect( throwErrorStub.callCount ).to.equal(1);
            });

            it( 'should throw an error if the alias used belongs to an alias set', function() {
                expect( function() { commands.note( 'test', 'aliasSet' ) } ).to.throw( Error, /Alias 'aliasSet' refers to an alias set/ );
                expect( throwErrorStub.callCount ).to.equal(1);
            })
        });

        describe( 'under success conditions', function() {
            it( 'if no alias provided, executes fp.hooks.getTargetPath() but not fp.hooks.getAlias()', function() {
                commands.note( 'test' );
                expect( targetPathStub.callCount ).to.equal( 1 );
                expect( getAliasStub.callCount ).to.equal( 0 );
            });

            it( 'if alias provided, executes fp.hooks.getAlias() but not fp.hooks.getTargetPath()', function() {
                commands.note( 'test', 'singleAlias' );
                expect( getAliasStub.callCount ).to.equal( 1 );
                expect( targetPathStub.callCount ).to.equal( 0 );
            });

            it( 'returns notepad execution statement based on filename and path of alias', function() {
                commands.note( 'targetTest' );
                expect( targetPathStub.callCount ).to.equal( 1 );
                expect( getAliasStub.callCount ).to.equal( 0 );

                expect( execStub.callCount ).to.equal( 1 );
                expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start notepad E:\\targetPath\\targetTest.txt' );

                expect( passErrorStub.callCount ).to.equal( 1 );

                commands.note( 'aliasTest', 'singleAlias' );
                expect( targetPathStub.callCount ).to.equal( 1 );
                expect( getAliasStub.callCount ).to.equal( 1 );

                expect( execStub.callCount ).to.equal( 2 );
                expect( execStub.args[ 1 ][ 0 ] ).to.equal( 'start notepad D:\\singleAliasPath\\aliasTest.txt' );

                expect( passErrorStub.callCount ).to.equal( 2 );
            });

        });

    });

    describe( 'notep', function() {

        var statStub;

        beforeEach( function() {
            statStub = sinon.stub( fs, 'statSync', function( filePath ) {
                switch( filePath ) {
                    case 'C:\\nonExistent':
                        throw new Error( 'notThere');
                        break;
                    case 'C:\\notDirectory.txt':
                        return {
                            isDirectory: function() { return false; }
                        };
                        break;
                    case 'C:\\filePath':
                        return {
                            isDirectory: function() { return true; }
                        };
                        break;
                }

            } );
        });

        afterEach( function() {
            statStub.restore();
        });


        describe( 'under failure conditions', function() {

            it( 'should throw an error if no filename is provided', function() {
                expect( function() { commands.notep() } ).to.throw( Error, /You must provide a filename./ );
                expect( throwErrorStub.callCount ).to.equal(1);
            });

            it( 'should throw an error if filepath not found', function() {
                expect( function() { commands.notep( 'C:\\nonExistent', 'test' ) } ).to.throw( Error, "File path 'C:\\nonExistent' not found." );
                expect( statStub.callCount ).to.equal( 1 );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should throw an error if filepath is not a directory', function() {
                expect( function() { commands.notep( 'C:\\notDirectory.txt', 'test' ) } ).to.throw( Error, "File path 'C:\\notDirectory.txt' does not exist as a directory." );
                expect( statStub.callCount ).to.equal( 1 );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

        });

        describe( 'under success conditions', function() {

            it( 'returns notepad execution statement based on filepath and filename', function() {
                commands.notep( 'C:\\filePath', 'test' );
                expect( statStub.callCount ).to.equal( 1 );
                expect( execStub.callCount ).to.equal( 1 );
                expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start notepad C:\\filePath\\test.txt' );
                expect( passErrorStub.callCount ).to.equal( 1 );
            });

        });

    });

    describe( 'killpad', function() {

        it( 'will return the notepad taskkill statement ', function() {
            commands.killpad();
            expect( execStub.callCount ).to.equal( 1 );
            expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'taskkill /im notepad.exe' );
        });

    });
});