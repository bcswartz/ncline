var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

//Rewire gives us a version of the commands file where non-exported variables and functions are available for manipulation/testing
var rewire = require( 'rewire' );
var rewiredCommands = rewire( '../commands' );

describe( 'batch commands', function() {
    var fs,
        os,
        childProcess,
        output,
        core,
        init,
        commands,
        data = {};

    before( function() {
        //Set stubs and mocks
        fs = sinon.stub();
        os = { platform: function() { return 'win32' } };
        childProcess = sinon.stub();
        output = sinon.stub();
        core = sinon.stub();

        init = {
            execute: function() {},
            getData: function() { return data },
            getConfig: function() { return 'dataFile.json' }
        };

        commands = proxyquire( '../commands', {
            'fs': fs,
            'os': os,
            'child_process': childProcess,
            '../../../lib/output': output,
            '../../../lib/core': core,
            './init': init
        } ).commands;

    });

    //Manage global stubs
    var throwErrorStub,
        passErrorStub,
        successStub,
        booleanValueStub;

    beforeEach( function() {
        throwErrorStub = sinon.stub( output, "throwError", function( msg ) { throw new Error( msg ) } );
        passErrorStub = sinon.stub( output, "passError", function() {} );
        successStub = sinon.stub( output, "success" );
        booleanValueStub = sinon.stub( core, "booleanValue" );
    });

    afterEach( function() {
        throwErrorStub.restore();
        passErrorStub.restore();
        successStub.restore();
        booleanValueStub.restore();
    });

    describe( 'parseBatchFileStatement', function() {

        var parseBatchFileStatement;

        before( function() {
            parseBatchFileStatement = rewiredCommands.__get__( 'parseBatchFileStatement' );
        });

        it( 'should return a string starting with "start" and the alias name', function() {
            var outcome = parseBatchFileStatement( 'C:\\batchFolder\\batchA.bat', 'runBatchA' );
            expect( outcome ).to.match( /^start "runBatchA"/ );
        });

        it( 'should contain "cmd /k"', function() {
            var outcome = parseBatchFileStatement( 'C:\\batchFolder\\batchA.bat', 'runBatchA' );
            expect( outcome ).to.contain( "cmd /k" );
        });

        it( 'should output different statements depending on whether a drive letter is included in the path', function() {
            var outcomeDriveLetter = parseBatchFileStatement( 'C:\\batchFolder\\batchA.bat', 'runBatchA' );
            var outcomeNoDriveLetter = parseBatchFileStatement( '\\batchFolder\\batchB.bat', 'runBatchB' );

            expect( outcomeDriveLetter ).to.equal( 'start "runBatchA" cmd /k "C: & cd \\batchFolder & batchA.bat"' );
            expect( outcomeNoDriveLetter ).to.equal( 'start "runBatchB" cmd /k "\\batchFolder & batchB.bat"' );
        });

    } );

    describe( 'setBatchAliasVerbose', function() {
        var isBooleanStub;

        beforeEach( function() {
            isBooleanStub = sinon.stub( core, "isBoolean" );
            delete data.verbose;
        });

        afterEach( function() {
            isBooleanStub.restore();
        });

        describe( 'under failure conditions', function () {
            it( 'should execute output.throwError, which throws an error, if no setting argument', function() {
                expect( function() { commands.setBatchAliasVerbose() } ).to.throw( Error, /You must provide a string representing a Boolean value/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                //Should throw error before calling core.isBoolean
                expect( isBooleanStub.callCount ).to.equal( 0 );
            });

            it( 'should execute output.throwError, which throws an error, if core.isBoolean returns false', function() {
                isBooleanStub.returns( false );

                expect( function() { commands.setBatchAliasVerbose( 'randomValue' ) } ).to.throw( Error, /You must provide a string representing a Boolean value/ );

                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( isBooleanStub.callCount ).to.equal( 1 );
                //Should throw error before calling core.booleanValue
                expect( booleanValueStub.callCount ).to.equal( 0 );
            });

        });

        describe( 'under success conditions', function() {
            it( 'should update the verbose key/value with the new true/false value', function() {
                var jsonResult;

                isBooleanStub.returns( true );
                booleanValueStub.withArgs( 'true' ).returns( true );
                booleanValueStub.withArgs( 'false' ).returns( false );

                fs.writeFile = function( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.setBatchAliasVerbose( 'true' );
                expect( isBooleanStub.callCount ).to.equal( 1 );
                expect( booleanValueStub.callCount ).to.equal( 1 );
                expect( jsonResult.verbose ).to.equal( true );

                commands.setBatchAliasVerbose( 'false' );
                expect( isBooleanStub.callCount ).to.equal( 2 );
                expect( booleanValueStub.callCount ).to.equal( 2 );
                expect( jsonResult.verbose ).to.equal( false );

            });

            it( 'should execute output.passError in its callback function', function() {
                isBooleanStub.returns( true );
                booleanValueStub.withArgs( 'true' ).returns( true );

                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.setBatchAliasVerbose( 'true' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            });
        });
    });

    describe( 'createBatchAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {};
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or filepath argument', function() {
                expect( function() { commands.createBatchAlias() } ).to.throw( Error, /The batch file alias and batch file parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.createBatchAlias( 'foo' ) } ).to.throw( Error, /The batch file alias and batch file parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias exists in data.aliases', function() {
                data.aliases = { firstAlias: 'C:\\firstBatch.bat' };

                expect( function() { commands.createBatchAlias( 'firstAlias', 'D:\\firstBatch.bat' ) } ).to.throw( Error, /'firstAlias' already exists; use updateBatchAlias or deleteBatchAlias/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should add the alias and filepath to data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                //Test pre-execution conditions
                expect( data.aliases ).to.not.have.property( 'goodAlias' );

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.createBatchAlias( 'goodAlias', 'C:\\goodBatch.bat' );

                expect( data.aliases ).to.have.property( 'goodAlias' );
                expect( jsonResult.aliases ).to.have.property( 'goodAlias' );
                expect( data.aliases.goodAlias ).to.equal( 'C:\\goodBatch.bat' );
                expect( jsonResult.aliases.goodAlias ).to.equal( 'C:\\goodBatch.bat' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.createBatchAlias( 'goodAlias', 'C:\\goodBatch.bat' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.createBatchAlias( 'goodAlias1', 'C:\\goodBatch.bat' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.createBatchAlias( 'goodAlias2', 'C:\\goodBatch.bat' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.createBatchAlias( 'goodAlias3', 'C:\\goodBatch.bat' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Batch file alias 'goodAlias3' set to 'C:\\goodBatch.bat'.")
            } );
        });
    });

    describe( 'updateBatchAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { aliasToChange: 'C:\\changeBatch.bat' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or filepath argument', function() {
                expect( function() { commands.updateBatchAlias() } ).to.throw( Error, /The batch file alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateBatchAlias( 'foo' ) } ).to.throw( Error, /The batch file alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.updateBatchAlias( 'notThere', 'D:\\notThere.bat' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

        });

        describe( 'under success conditions', function() {
            it( 'should update the alias filepath in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.updateBatchAlias( 'aliasToChange', 'D:\\newPath\\newFile.bat' );

                expect( data.aliases ).to.have.property( 'aliasToChange' );
                expect( jsonResult.aliases ).to.have.property( 'aliasToChange' );
                expect( data.aliases.aliasToChange ).to.equal( 'D:\\newPath\\newFile.bat' );
                expect( jsonResult.aliases.aliasToChange ).to.equal( 'D:\\newPath\\newFile.bat' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.updateBatchAlias( 'aliasToChange', 'D:\\newPath\\newFile.bat' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateBatchAlias( 'aliasToChange', 'D:\\newPath\\newFile.bat' );
                expect( data.aliases.aliasToChange ).to.equal( 'D:\\newPath\\newFile.bat' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.updateBatchAlias( 'aliasToChange', 'E:\\newPath\\newFile.bat' );
                expect( data.aliases.aliasToChange ).to.equal( 'E:\\newPath\\newFile.bat' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateBatchAlias( 'aliasToChange', 'F:\\newPath\\newFile.bat' );
                expect( data.aliases.aliasToChange ).to.equal( 'F:\\newPath\\newFile.bat' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Batch file alias 'aliasToChange' updated to 'F:\\newPath\\newFile.bat'.")
            } );
        });
    });

    describe( 'renameBatchAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { aliasToRename: 'C:\\renameBatch.bat' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no currentAlias or newAlias argument', function() {
                expect( function() { commands.renameBatchAlias() } ).to.throw( Error, /The current and new alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.renameBatchAlias( 'foo' ) } ).to.throw( Error, /The current and new alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.renameBatchAlias( 'notThere', 'D:\\notThere.bat' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

        });

        describe( 'under success conditions', function() {
            it( 'should update the alias name in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.renameBatchAlias( 'aliasToRename', 'newAliasName' );

                expect( data.aliases ).to.not.have.property( 'aliasToRename' );
                expect( data.aliases ).to.have.property( 'newAliasName' );

                expect( jsonResult.aliases ).to.not.have.property( 'aliasToRename' );
                expect( jsonResult.aliases ).to.have.property( 'newAliasName' );

                expect( data.aliases.newAliasName ).to.equal( 'C:\\renameBatch.bat' );
                expect( jsonResult.aliases.newAliasName ).to.equal( 'C:\\renameBatch.bat' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.renameBatchAlias( 'aliasToRename', 'newAliasName' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameBatchAlias( 'aliasToRename', 'newAliasName' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.renameBatchAlias( 'newAliasName', 'secondName' );
                expect( data.aliases ).to.have.property( 'secondName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameBatchAlias( 'secondName', 'thirdName' );
                expect( data.aliases ).to.have.property( 'thirdName' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Batch file alias 'secondName' renamed to 'thirdName'.");
            } );
        });
    });

    describe( 'deleteBatchAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { aliasToDelete: 'C:\\deleteBatch.bat' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { commands.deleteBatchAlias() } ).to.throw( Error, /The batch file alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.deleteBatchAlias( 'notThere' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

        });

        describe( 'under success conditions', function() {
            it( 'should remove the alias in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                expect( data.aliases ).to.have.property( 'aliasToDelete' );

                commands.deleteBatchAlias( 'aliasToDelete' );

                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasToDelete' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.deleteBatchAlias( 'aliasToDelete' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                expect( data.aliases ).to.have.property( 'aliasToDelete' );

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteBatchAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasToDelete: 'C:\\deleteBatch.bat' };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.deleteBatchAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasToDelete: 'C:\\deleteBatch.bat' };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteBatchAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Batch file alias 'aliasToDelete' deleted.")
            } );
        });
    });

    describe( 'showBatches', function() {

        var sortPropsStub, promptStub, logStub;

        beforeEach( function() {
            sortPropsStub = sinon.stub( core, 'sortObjectProperties', function( aliases ) { return aliases } );
            promptStub = sinon.stub( output, 'prompt' );
            logStub = sinon.stub( console, 'log' );
        });

        afterEach( function() {
            sortPropsStub.restore();
            logStub.restore();
            promptStub.restore();
        });

        it( 'should output a title line regardless of aliases content', function() {
            data.aliases = {};
            commands.showBatches();
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.args.length ).to.equal( 1 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current batch file aliases:' );
        });

        it( 'for a single alias, should return one line with alias name and path value', function() {
            data.aliases = { aliasA: 'C:\\' }
            commands.showBatches();
            expect( logStub.callCount ).to.equal( 2 );
            expect( logStub.args.length ).to.equal( 2 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current batch file aliases:' );
            expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'aliasA: C:\\' );
        });

        it( 'for an alias set, should return one line for the alias name, one line for each path, and then an empty line', function() {
            data.aliases = { aliasSetA: [ 'C:\\', 'D:\\' ] }
            commands.showBatches();
            expect( logStub.callCount ).to.equal( 5 );
            expect( logStub.args.length ).to.equal( 5 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current batch file aliases:' );
            expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'aliasSetA:' );
            expect( logStub.args[ 2 ][ 0 ] ).to.equal( '   C:\\' );
            expect( logStub.args[ 3 ][ 0 ] ).to.equal( '   D:\\' );
            expect( logStub.args[ 4 ][ 0 ] ).to.equal( '' );
        });
    });


    describe( 'batch', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { batchToExecute: 'C:\\executeBatch.bat' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { commands.batch() } ).to.throw( Error, /The batch file alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal(1);
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.batch( 'notThere' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal(1);
            });

        });

        describe( 'under success conditions', function() {
            it( 'should execute output.passError in its callback function', function () {
                childProcess.exec = sinon.stub();
                childProcess.exec.callsArgWith( 1, null );

                commands.batch( 'batchToExecute' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );
        })
    });
});