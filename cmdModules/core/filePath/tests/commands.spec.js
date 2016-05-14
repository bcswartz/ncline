var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

describe( 'filePath commands', function() {
    var fs,
        output,
        core,
        init,
        exports,
        commands,
        hooks,
        data = {};

    before( function() {
        //Set stubs
        fs = sinon.stub();
        output = sinon.stub();
        core = sinon.stub();

        init = {
            execute: function() {},
            getData: function() { return data },
            getConfig: function() { return 'dataFile.json' }
        };

        exports = proxyquire( '../commands', {
            'fs': fs,
            '../../../lib/output': output,
            '../../../lib/core': core,
            './init': init
        } );

        commands = exports.commands;
        hooks = exports.hooks;

    });

    //Manage global stubs
    var throwErrorStub,
        passErrorStub,
        successStub,
        msgStub,
        booleanValueStub;

    beforeEach( function() {
        throwErrorStub = sinon.stub( output, "throwError", function( msg ) { throw new Error( msg ) } );
        passErrorStub = sinon.stub( output, "passError", function() {} );
        successStub = sinon.stub( output, "success" );
        msgStub = sinon.stub( output, "msg" );
        booleanValueStub = sinon.stub( core, "booleanValue" );
    });

    afterEach( function() {
        throwErrorStub.restore();
        passErrorStub.restore();
        successStub.restore();
        msgStub.restore();
        booleanValueStub.restore();
    })

    describe( 'setPathVerbose', function() {

        var isBooleanStub;

        beforeEach( function() {
            isBooleanStub = sinon.stub( core, "isBoolean" );
            delete data.verbose;
        })

        afterEach( function() {
            isBooleanStub.restore();
        })

        describe( 'under failure conditions', function () {
            it( 'should execute output.throwError, which throws an error, if no setting argument', function() {
                expect( function() { commands.setPathVerbose() } ).to.throw( Error, /You must provide a string representing a Boolean value/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                //Should throw error before calling core.isBoolean
                expect( isBooleanStub.callCount ).to.equal( 0 );
            });

            it( 'should execute output.throwError, which throws an error, if core.isBoolean returns false', function() {
                isBooleanStub.returns( false );

                expect( function() { commands.setPathVerbose( 'randomValue' ) } ).to.throw( Error, /You must provide a string representing a Boolean value/ );

                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( isBooleanStub.callCount ).to.equal( 1 );
                //Should throw error before calling core.booleanValue
                expect( booleanValueStub.callCount ).to.equal( 0 );
            });

        })

        describe( 'under success conditions', function() {
            it( 'should update the verbose key/value with the new true/false value', function() {
                var jsonResult;

                isBooleanStub.returns( true );
                booleanValueStub.withArgs( 'true' ).returns( true );
                booleanValueStub.withArgs( 'false' ).returns( false );

                fs.writeFile = function( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.setPathVerbose( 'true' );
                expect( isBooleanStub.callCount ).to.equal( 1 );
                expect( booleanValueStub.callCount ).to.equal( 1 );
                expect( jsonResult.verbose ).to.equal( true );

                commands.setPathVerbose( 'false' );
                expect( isBooleanStub.callCount ).to.equal( 2 );
                expect( booleanValueStub.callCount ).to.equal( 2 );
                expect( jsonResult.verbose ).to.equal( false );

            })

            it( 'should execute output.passError in its callback function', function() {
                isBooleanStub.returns( true );
                booleanValueStub.withArgs( 'true' ).returns( true );

                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.setPathVerbose( 'true' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            })
        })


    });

    describe( 'createAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {};
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or filepath argument', function() {
                expect( function() { commands.createAlias() } ).to.throw( Error, /The alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.createAlias( 'foo' ) } ).to.throw( Error, /The alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias exists in data.aliases', function() {
                data.aliases = {
                    firstAlias: 'C:\\',
                    secondAlias: [
                        'C:\\',
                        'D:\\'
                    ]
                };

                expect( function() { commands.createAlias( 'firstAlias', 'D:\\' ) } ).to.throw( Error, /'firstAlias' already exists; use updateAlias or deleteAlias/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( function() { commands.createAlias( 'secondAlias', 'D:\\' ) } ).to.throw( Error, /'secondAlias' already exists as an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should add the alias and filepath to data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                //Test pre-execution conditions
                expect( data.aliases ).to.not.have.property( 'goodAlias' );

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.createAlias( 'goodAlias', 'C:\\' );

                expect( data.aliases ).to.have.property( 'goodAlias' );
                expect( jsonResult.aliases ).to.have.property( 'goodAlias' );
                expect( data.aliases.goodAlias ).to.equal( 'C:\\' );
                expect( jsonResult.aliases.goodAlias ).to.equal( 'C:\\' );
            } )

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.createAlias( 'goodAlias', 'C:\\' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.createAlias( 'goodAlias1', 'C:\\' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.createAlias( 'goodAlias2', 'C:\\' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.createAlias( 'goodAlias3', 'C:\\' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path alias 'goodAlias3' set to 'C:\\'." );
            } )
        });
    });

    describe( 'updateAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { aliasToChange: 'C:\\' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or filepath argument', function() {
                expect( function() { commands.updateAlias() } ).to.throw( Error, /The alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateAlias( 'foo' ) } ).to.throw( Error, /The alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.updateAlias( 'notThere', 'D:\\' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is alias set', function() {
                data.aliases.aliasSet = [
                        'C:\\',
                        'D:\\'
                    ];

                expect( function() { commands.updateAlias( 'aliasSet', 'D:\\' ) } ).to.throw( Error, /'aliasSet' belongs to an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should update the alias filepath in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.updateAlias( 'aliasToChange', 'D:\\' );

                expect( data.aliases ).to.have.property( 'aliasToChange' );
                expect( jsonResult.aliases ).to.have.property( 'aliasToChange' );
                expect( data.aliases.aliasToChange ).to.equal( 'D:\\' );
                expect( jsonResult.aliases.aliasToChange ).to.equal( 'D:\\' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.updateAlias( 'aliasToChange', 'D:\\' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateAlias( 'aliasToChange', 'E:\\' );
                expect( data.aliases.aliasToChange ).to.equal( 'E:\\' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.updateAlias( 'aliasToChange', 'F:\\' );
                expect( data.aliases.aliasToChange ).to.equal( 'F:\\' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateAlias( 'aliasToChange', 'G:\\' );
                expect( data.aliases.aliasToChange ).to.equal( 'G:\\' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path alias 'aliasToChange' updated to 'G:\\'." );
            } )
        });
    });

    describe( 'renameAlias', function() {
        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                aliasToRename: 'D:\\',
                aliasSet: [
                    'E:\\'
                ]
            }
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no currentAlias or newAlias argument', function() {
                expect( function() { commands.renameAlias() } ).to.throw( Error, /The current and new alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.renameAlias( 'foo' ) } ).to.throw( Error, /The current and new alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });

            it( 'should execute output.throwError with appropriate message if currentAlias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.renameAlias( 'notThere', 'newAliasName' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is alias set', function() {
                expect( function() { commands.renameAlias( 'aliasSet', 'newAliasName' ) } ).to.throw( Error, /'aliasSet' belongs to an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should update the alias name in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.renameAlias( 'aliasToRename', 'newAliasName' );

                expect( data.aliases ).to.not.have.property( 'aliasToRename' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasToRename' );
                expect( jsonResult.aliases ).to.have.property( 'newAliasName' );
                expect( data.aliases.newAliasName ).to.equal( 'D:\\' );
                expect( jsonResult.aliases.newAliasName ).to.equal( 'D:\\' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.renameAlias( 'aliasToRename', 'newAliasName' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameAlias( 'aliasToRename', 'newAliasName' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.renameAlias( 'newAliasName', 'secondName' );
                expect( data.aliases ).to.have.property( 'secondName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameAlias( 'secondName', 'thirdName' );
                expect( data.aliases ).to.have.property( 'thirdName' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path alias 'secondName' renamed to 'thirdName'." );
            } )
        });
    });

    describe( 'deleteAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { aliasToDelete: 'C:\\' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { commands.deleteAlias() } ).to.throw( Error, /The alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.deleteAlias( 'notThere' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is alias set', function() {
                data.aliases.aliasSet = [
                    'C:\\',
                    'D:\\'
                ];

                expect( function() { commands.deleteAlias( 'aliasSet' ) } ).to.throw( Error, /'aliasSet' belongs to an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should remove the alias in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                expect( data.aliases ).to.have.property( 'aliasToDelete' );

                commands.deleteAlias( 'aliasToDelete' );

                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasToDelete' );
            } )

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.deleteAlias( 'aliasToDelete' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } )

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                expect( data.aliases ).to.have.property( 'aliasToDelete' );

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasToDelete: 'C:\\' };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.deleteAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasToDelete: 'C:\\' };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path alias 'aliasToDelete' deleted." );
            } )
        });
    });

    describe( 'createAliasSet', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {};
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or filepath argument', function() {
                expect( function() { commands.createAliasSet() } ).to.throw( Error, /The alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.createAliasSet( 'foo' ) } ).to.throw( Error, /The alias and filepath parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias exists in data.aliases', function() {
                data.aliases = {
                    firstAlias: 'C:\\',
                    secondAlias: [
                        'C:\\',
                        'D:\\'
                    ]
                };

                expect( function() { commands.createAliasSet( 'firstAlias', 'D:\\' ) } ).to.throw( Error, /'firstAlias' already exists; use updateAlias or deleteAlias/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( function() { commands.createAliasSet( 'secondAlias', 'D:\\' ) } ).to.throw( Error, /'secondAlias' already exists as an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should add the alias and array with filepath to data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                //Test pre-execution conditions
                expect( data.aliases ).to.not.have.property( 'goodAliasSet' );

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.createAliasSet( 'goodAliasSet', 'C:\\' );

                expect( data.aliases ).to.have.property( 'goodAliasSet' );
                expect( jsonResult.aliases ).to.have.property( 'goodAliasSet' );

                expect( data.aliases.goodAliasSet ).to.be.a( 'array' );
                expect( jsonResult.aliases.goodAliasSet ).to.be.a( 'array' );

                expect( data.aliases.goodAliasSet.length ).to.equal( 1 );
                expect( jsonResult.aliases.goodAliasSet.length ).to.equal( 1 );

                expect( data.aliases.goodAliasSet[ 0 ] ).to.equal( 'C:\\' );
                expect( jsonResult.aliases.goodAliasSet[ 0 ] ).to.equal( 'C:\\' );
            } )

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.createAliasSet( 'goodAliasSet', 'C:\\' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } )

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.createAliasSet( 'goodAliasSet1', 'C:\\' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.createAliasSet( 'goodAliasSet2', 'C:\\' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.createAliasSet( 'goodAliasSet3', 'C:\\' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Alias set 'goodAliasSet3' created with first path set to 'C:\\'." );
            } )
        });
    });

    describe( 'updateAliasSet', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { aliasSetToUpdate: [ 'C:\\', 'D:\\' ] };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias, action, or filepath argument', function() {
                var expectedMsg = "The alias, action ('add', 'update', or 'delete') and filepath parameters must be defined.";
                expect( function() { commands.updateAliasSet() } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 2 );

                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate', 'update' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 3 );
                //Confirm aliasSet not altered
                expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'C:\\', 'D:\\' ] );
            });

            it( 'should execute output.throwError if action is not "add", "update", or "delete"', function() {
                var expectedMsg = "The action must be either 'add', 'update' or 'delete'.";
                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate', 'append', 'E:\\' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate', 'edit', 'E:\\' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 2 );

                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate', 'remove', 'E:\\' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 3 );

                //Confirm aliasSet not altered
                expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'C:\\', 'D:\\' ] );
            });

            it( 'should execute output.throwError with appropriate message if action is "update" and replacement path not supplied', function() {
                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate', 'update', 'C:\\' ) } ).to.throw( Error, /you must provide 2 filepaths/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.updateAliasSet( 'notThere', 'delete', 'C:\\' ) } ).to.throw( Error, /'notThere' not found; use createAliasSet to create./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is regular alias', function() {
                data.aliases.singleAlias = 'C:\\';

                expect( function() { commands.updateAliasSet( 'singleAlias', 'delete', 'C:\\' ) } ).to.throw( Error, /'singleAlias' does not match an alias set./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if action is "update" or "delete" but specified filepath not present in alias set', function() {
                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate', 'update', 'C:\\notThere', 'D:\\notThere' ); } ).to.throw( Error, /not found in alias set 'aliasSetToUpdate'/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateAliasSet( 'aliasSetToUpdate', 'delete', 'C:\\notThere' ); } ).to.throw( Error, /not found in alias set 'aliasSetToUpdate'/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });
        });

        describe( 'under success conditions', function() {

            describe( 'with "add" action', function() {
                it( 'should add the alias to the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 2 );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateAliasSet( 'aliasSetToUpdate', 'add', 'E:\\' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 3 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 3 );

                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'C:\\', 'D:\\', 'E:\\' ] );
                } )

                it( 'should execute output.passError in its callback function', function () {
                    fs.writeFile = sinon.stub();
                    fs.writeFile.callsArgWith( 2, null );

                    commands.updateAliasSet( 'aliasSetToUpdate', 'add', 'E:\\' );

                    expect( passErrorStub.callCount ).to.equal( 1 );
                } )

                it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                    fs.writeFile = sinon.stub();

                    booleanValueStub.returns( false );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'add', 'E:\\' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'add', 'E:\\' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'add', 'E:\\' );
                    expect( successStub.callCount ).to.equal( 1 );
                    expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path 'E:\\' added to alias set 'aliasSetToUpdate'." );
                } )
            })

            describe( 'with "update" action', function() {
                it( 'should update the targeted alias in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'C:\\', 'D:\\' ] );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateAliasSet( 'aliasSetToUpdate', 'update', 'C:\\', 'F:\\' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 2 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 2 );

                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'F:\\', 'D:\\' ] );
                } )

                it( 'should execute output.passError in its callback function', function () {
                    fs.writeFile = sinon.stub();
                    fs.writeFile.callsArgWith( 2, null );

                    commands.updateAliasSet( 'aliasSetToUpdate', 'update', 'C:\\', 'F:\\' );

                    expect( passErrorStub.callCount ).to.equal( 1 );
                } )

                it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                    fs.writeFile = sinon.stub();

                    booleanValueStub.returns( false );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'update', 'C:\\', 'F:\\' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'update', 'D:\\', 'G:\\' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'update', 'F:\\', 'H:\\' );
                    expect( successStub.callCount ).to.equal( 1 );
                    expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Alias set 'aliasSetToUpdate' path 'F:\\' changed to 'H:\\'." );

                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'H:\\', 'G:\\' ] );
                } )
            })

            describe( 'with "delete" action', function() {
                it( 'should delete the targeted alias in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'C:\\', 'D:\\' ] );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateAliasSet( 'aliasSetToUpdate', 'delete', 'C:\\' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 1 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 1 );

                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'D:\\' ] );
                } )

                it( 'should execute output.passError in its callback function', function () {
                    fs.writeFile = sinon.stub();
                    fs.writeFile.callsArgWith( 2, null );

                    commands.updateAliasSet( 'aliasSetToUpdate', 'delete', 'C:\\' );

                    expect( passErrorStub.callCount ).to.equal( 1 );
                } )

                it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                    fs.writeFile = sinon.stub();

                    booleanValueStub.returns( false );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'delete', 'C:\\' );
                    expect( successStub.callCount ).to.equal( 0 );

                    //Reset
                    data.aliases = { aliasSetToUpdate: [ 'C:\\', 'D:\\' ] };

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'delete', 'C:\\' );
                    expect( successStub.callCount ).to.equal( 0 );

                    //Reset
                    data.aliases = { aliasSetToUpdate: [ 'C:\\', 'D:\\' ] };

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateAliasSet( 'aliasSetToUpdate', 'delete', 'C:\\' );
                    expect( successStub.callCount ).to.equal( 1 );
                    expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path 'C:\\' removed from alias set 'aliasSetToUpdate'." );

                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( [ 'D:\\' ] );
                } )
            })

        });
    });

    describe( 'renameAliasSet', function() {
        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                simpleAlias: 'E:\\',
                aliasSetToRename: [
                    'D:\\'
                ]
            }
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no currentAlias or newAlias argument', function() {
                expect( function() { commands.renameAliasSet() } ).to.throw( Error, /The current and new alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.renameAliasSet( 'foo' ) } ).to.throw( Error, /The current and new alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });

            it( 'should execute output.throwError with appropriate message if currentAlias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.renameAliasSet( 'notThere', 'newAliasName' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is ', function() {
                expect( function() { commands.renameAliasSet( 'simpleAlias', 'newAliasName' ) } ).to.throw( Error, /'simpleAlias' does not match an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should update the alias name in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.renameAliasSet( 'aliasSetToRename', 'newAliasName' );

                expect( data.aliases ).to.not.have.property( 'aliasSetToRename' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasSetToRename' );
                expect( jsonResult.aliases ).to.have.property( 'newAliasName' );
                expect( data.aliases.newAliasName[ 0 ] ).to.equal( 'D:\\' );
                expect( jsonResult.aliases.newAliasName[ 0 ] ).to.equal( 'D:\\' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.renameAliasSet( 'aliasSetToRename', 'newAliasName' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameAliasSet( 'aliasSetToRename', 'newAliasName' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.renameAliasSet( 'newAliasName', 'secondName' );
                expect( data.aliases ).to.have.property( 'secondName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameAliasSet( 'secondName', 'thirdName' );
                expect( data.aliases ).to.have.property( 'thirdName' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path alias set 'secondName' renamed to 'thirdName'." );
            } )
        });
    });

    describe( 'deleteAliasSet', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = { aliasSetToDelete: [ 'C:\\', 'F:\\' ] };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { commands.deleteAliasSet() } ).to.throw( Error, /The alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.deleteAliasSet( 'notThere' ) } ).to.throw( Error, /'notThere' not found./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is regular alias', function() {
                data.aliases.singleAlias = 'C:\\';

                expect( function() { commands.deleteAliasSet( 'singleAlias' ) } ).to.throw( Error, /'singleAlias' does not match an alias set./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should remove the alias in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                expect( data.aliases ).to.have.property( 'aliasSetToDelete' );

                commands.deleteAliasSet( 'aliasSetToDelete' );

                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasSetToDelete' );
            } )

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.deleteAliasSet( 'aliasSetToDelete' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } )

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                expect( data.aliases ).to.have.property( 'aliasSetToDelete' );

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteAliasSet( 'aliasSetToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasSetToDelete: [ 'C:\\', 'D:\\' ] };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.deleteAliasSet( 'aliasSetToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasSetToDelete: [ 'C:\\', 'D:\\' ] };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteAliasSet( 'aliasSetToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Path alias set 'aliasSetToDelete' deleted." );

            } )
        });
    });

    describe( 'target', function() {
        beforeEach( function() {
            data.aliases = {
                cDrive: 'C:\\',
                dDrive: 'D:\\',
                aliasSet: [
                    'E:\\',
                    'F:\\'
                ]
            };

            data.target = { alias: 'cDrive', path: 'C:\\' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if alias argument does not match existing alias', function() {
                expect( function() { commands.target( 'notThere' ) } ).to.throw( Error, /Filepath alias 'notThere' not recognized/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError if alias argument matches an alias set', function() {
                expect( function() { commands.target( 'aliasSet' ) } ).to.throw( Error, /Alias 'aliasSet' refers to an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            })
        });

        describe( 'under success conditions', function() {
            it( 'should copy previous target to previousTarget, update data.target and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.target( 'dDrive' );

                expect( data ).to.have.property( 'previousTarget' );
                expect( jsonResult ).to.have.property( 'previousTarget' );

                expect( data.previousTarget ).to.deep.equal( { alias: 'cDrive', path: 'C:\\' } );
                expect( jsonResult.previousTarget ).to.deep.equal( { alias: 'cDrive', path: 'C:\\' } );

                expect( data.target ).to.deep.equal( { alias: 'dDrive', path: 'D:\\' } );
                expect( jsonResult.target ).to.deep.equal( { alias: 'dDrive', path: 'D:\\' } );
            } )

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.target( 'dDrive' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.target( 'dDrive' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.target( 'dDrive' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.target( 'dDrive' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Target path set to 'dDrive': D:\\" );
            } );

            it( 'should execute output.msg if no alias is specified', function() {
                commands.target();

                expect( msgStub.callCount ).to.equal( 1 );
                expect( msgStub.args[ 0 ][ 0 ] ).to.equal( "Current target alias:path is 'cDrive': C:\\" );
            })
        });
    })

    describe( 'source', function() {
        beforeEach( function() {
            data.aliases = {
                cDrive: 'C:\\',
                dDrive: 'D:\\',
                aliasSet: [
                    'E:\\',
                    'F:\\'
                ]
            };

            data.source = { alias: 'cDrive', path: 'C:\\' };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if alias argument does not match existing alias', function() {
                expect( function() { commands.source( 'notThere' ) } ).to.throw( Error, /Filepath alias 'notThere' not recognized/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError if alias argument matches an alias set', function() {
                expect( function() { commands.source( 'aliasSet' ) } ).to.throw( Error, /Alias 'aliasSet' refers to an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            })
        });

        describe( 'under success conditions', function() {
            it( 'should copy previous source to previousSource, update data.source and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.source( 'dDrive' );

                expect( data ).to.have.property( 'previousSource' );
                expect( jsonResult ).to.have.property( 'previousSource' );

                expect( data.previousSource ).to.deep.equal( { alias: 'cDrive', path: 'C:\\' } );
                expect( jsonResult.previousSource ).to.deep.equal( { alias: 'cDrive', path: 'C:\\' } );

                expect( data.source ).to.deep.equal( { alias: 'dDrive', path: 'D:\\' } );
                expect( jsonResult.source ).to.deep.equal( { alias: 'dDrive', path: 'D:\\' } );
            } )

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.source( 'dDrive' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.source( 'dDrive' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.source( 'dDrive' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.source( 'dDrive' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Source path set to 'dDrive': D:\\" );
            } );

            it( 'should execute output.msg and return the current source if no alias is specified', function() {
                commands.source();

                expect( msgStub.callCount ).to.equal( 1 );
                expect( msgStub.args[ 0 ][ 0 ] ).to.equal( "Current source alias:path is 'cDrive': C:\\" );
            });

            it( 'should execute output.msg and report no source if no source set and no alias is specified', function() {
                data.source = {};
                commands.source();

                expect( msgStub.callCount ).to.equal( 1 );
                expect( msgStub.args[ 0 ][ 0 ] ).to.equal( "Currently no source alias/path is defined." );
            });


        });
    })

    describe( 'clearSource', function() {
        beforeEach( function() {
            data.source = { alias: 'dDrive', path: 'D:\\' };
            data.previousSource = { alias: 'cDrive', path: 'C:\\' };
        })

        it( 'should copy the current source to previousSource then empty source and execute writeFile if legal function call', function() {
            var jsonResult;

            fs.writeFile = function ( dataFile, jsonString, callback ) {
                jsonResult = JSON.parse( jsonString );
            }

            commands.clearSource();

            expect( data.previousSource ).to.deep.equal( { alias: 'dDrive', path: 'D:\\' } );
            expect( jsonResult.previousSource ).to.deep.equal( { alias: 'dDrive', path: 'D:\\' } );

            expect( data.source ).to.deep.equal( {} );
            expect( jsonResult.source ).to.deep.equal( {} );
        });

        it( 'should execute output.passError in its callback function', function () {
            fs.writeFile = sinon.stub();
            fs.writeFile.callsArgWith( 2, null );

            commands.clearSource();

            expect( passErrorStub.callCount ).to.equal( 1 );
        } );

        it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
            fs.writeFile = sinon.stub();

            booleanValueStub.returns( false );
            fs.writeFile.callsArgWith( 2, null );
            commands.clearSource();
            expect( successStub.callCount ).to.equal( 0 );

            booleanValueStub.returns( true );
            fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
            commands.clearSource();
            expect( successStub.callCount ).to.equal( 0 );

            booleanValueStub.returns( true );
            fs.writeFile.callsArgWith( 2, null );
            commands.clearSource();
            expect( successStub.callCount ).to.equal( 1 );
            expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Source cleared." );
        } );
    });

    describe( 'showPaths', function() {

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
            commands.showPaths();
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.args.length ).to.equal( 1 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current filepath aliases:' );
        });

        it( 'for a single alias, should return one line with alias name and path value', function() {
            data.aliases = { aliasA: 'C:\\' }
            commands.showPaths();
            expect( logStub.callCount ).to.equal( 2 );
            expect( logStub.args.length ).to.equal( 2 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current filepath aliases:' );
            expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'aliasA: C:\\' );
        });

        it( 'for an alias set, should return one line for the alias name, one line for each path, and then an empty line', function() {
            data.aliases = { aliasSetA: [ 'C:\\', 'D:\\' ] }
            commands.showPaths();
            expect( logStub.callCount ).to.equal( 5 );
            expect( logStub.args.length ).to.equal( 5 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current filepath aliases:' );
            expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'aliasSetA:' );
            expect( logStub.args[ 2 ][ 0 ] ).to.equal( '   C:\\' );
            expect( logStub.args[ 3 ][ 0 ] ).to.equal( '   D:\\' );
            expect( logStub.args[ 4 ][ 0 ] ).to.equal( '' );
        });
    });

    describe( 'getAlias', function() {
        beforeEach( function() {
            data.aliases = { cDrive: 'C:\\', cSet: [ 'C:\\', 'C:\\User' ] };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { hooks.getAlias() } ).to.throw( Error, /The alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError if alias not found', function() {
                expect( function() { hooks.getAlias( 'notThere' ) } ).to.throw( Error, /Alias 'notThere' not found./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should return the alias path for a non-set alias', function() {
                var aliasValue = hooks.getAlias( 'cDrive' );
                expect( aliasValue ).to.equal( 'C:\\' );
            });

            it( 'should return the alias array for an alias set', function() {
                var aliasValue = hooks.getAlias( 'cSet' );
                expect( aliasValue ).to.deep.equal( [ 'C:\\', 'C:\\User' ] );
            })
        });

    })
})
