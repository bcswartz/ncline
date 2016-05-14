var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

//Rewire gives us a version of the commands file where non-exported variables and functions are available for manipulation/testing
var rewire = require( 'rewire' );
var rewiredCommands = rewire( '../commands' );

describe( 'browser commands', function() {
    var fs,
        os,
        childProcess,
        output,
        core,
        init,
        data = {},
        exports,
        commands,
        hooks;

    before( function() {
        //Set stubs
        fs = sinon.stub();
        os = sinon.stub();
        childProcess = sinon.stub();
        output = sinon.stub();
        core = sinon.stub();

        init = {
            execute: function() {},
            getData: function() { return data },
            getConfig: function() { return 'dataFile.json' }
        };

        exports = proxyquire( '../commands', {
            'fs': fs,
            'os': os,
            'child_process': childProcess,
            '../../../lib/output': output,
            '../../../lib/core': core,
            './init': init
        });

        commands = exports.commands;
        hooks = exports.hooks;

    });

    //Manage global stubs
    var osPlatformStub,
        throwErrorStub,
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
    });

    describe( 'findSetMemberIndex', function() {

        var findSetMemberIndex,
            aliasSet;

        before( function() {
            findSetMemberIndex = rewiredCommands.__get__( 'findSetMemberIndex' );
            aliasSet = [
                { url: 'www.one.com', browser: 'chrome' },
                { url: 'www.two.com', browser: 'firefox' },
                { url: 'www.one.com', browser: 'default' }
            ]
        });

        describe( 'if identifier argument is supposed to be a URL', function() {
            it( 'should return the array index value of the last match', function() {
                var resultOne = findSetMemberIndex( aliasSet, 'www.one.com' );
                expect( resultOne ).to.equal( 2 );

                var resultTwo = findSetMemberIndex( aliasSet, 'www.two.com' );
                expect( resultTwo ).to.equal( 1 );
            });

            it( 'should return -1 if no match found', function() {
                var result = findSetMemberIndex( aliasSet, 'www.2.com' );
                expect( result ).to.equal( -1 );
            });
        });

        describe( 'if identifier argument is supposed to be an index value', function() {
            it( 'should return the identifier if it is a string representation of an integer', function() {
                var resultZero = findSetMemberIndex( aliasSet, '0' );
                expect( resultZero ).to.equal( 0 );

                var resultTwo = findSetMemberIndex( aliasSet, '2' );
                expect( resultTwo ).to.equal( 2 );
            });

            it( 'should return the closest index integer value if the identifier can be translated to an integer', function() {
                var result = findSetMemberIndex( aliasSet, '1.45' );
                expect( result ).to.equal( 1 );
            });

            it( 'should return -1 if the array element does not exist', function() {
                var result = findSetMemberIndex( aliasSet, '5' );
                expect( result ).to.equal( -1 );
            });

            it( 'should return -1 if the identifier cannot be translated to an integer', function() {
                var result = findSetMemberIndex( aliasSet, 'bogus' );
                expect( result ).to.equal( -1 );
            });

        });

    } );

    describe( 'getBrowserExecutionString', function() {
        var aliasOne,
            aliasTwo,
            dataRevert;

        before( function() {
            aliasOne = { url: 'www.one.com', browser: 'default' };
            aliasTwo = { url: 'www.two.com', browser: 'chrome' };
        });

        beforeEach( function() {
            data.defaultBrowser = 'fakeBrowser';
        });

        describe( 'when the os is win32', function() {

            beforeEach( function() {
                osPlatformStub = sinon.stub( os, "platform", function() { return 'win32' } );
            });

            afterEach( function() {
                osPlatformStub.restore();
            });

            it( 'should return an execution string that starts with "start"', function() {
                var result = hooks.getBrowserExecutionString( aliasOne );
                expect( result ).to.match( /^start/ );
            });

            it( 'should use the data.defaultBrowser value for the browser executable when the alias browser is set to "default"', function() {
                var result = hooks.getBrowserExecutionString( aliasOne );
                expect( result ).to.equal( 'start fakeBrowser www.one.com' );
            });

            it( 'should use the alias browser value in the execution string when not set to "default"', function() {
                var result = hooks.getBrowserExecutionString( aliasTwo );
                expect( result ).to.equal( 'start chrome www.two.com' );
            });
        });

        describe( 'when the os is darwin', function() {

            beforeEach( function() {
                osPlatformStub = sinon.stub( os, "platform", function() { return 'darwin' } );
            });

            afterEach( function() {
                osPlatformStub.restore();
            });

            it( 'should return an execution string that starts with "open"', function() {
                var result = hooks.getBrowserExecutionString( aliasOne );
                expect( result ).to.match( /^open/ );
            });

            it( 'should use the data.defaultBrowser value for the browser executable when the alias browser is set to "default"', function() {
                var result = hooks.getBrowserExecutionString( aliasOne );
                expect( result ).to.equal( 'open -a "fakeBrowser" www.one.com' );
            });

            it( 'should not include the "-a" switch if data.defaultBrowser value is used and is ""', function() {
                data.defaultBrowser = '';
                var result = hooks.getBrowserExecutionString( aliasOne );
                expect( result ).to.equal( 'open www.one.com' );
            });

            it( 'should use the alias browser value in the execution string when not set to "default"', function() {
                var result = hooks.getBrowserExecutionString( aliasTwo );
                expect( result ).to.equal( 'open -a "chrome" www.two.com' );
            });
        });
    });

    describe( 'setWebAliasVerbose', function() {
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
                expect( function() { commands.setWebAliasVerbose() } ).to.throw( Error, /You must provide a string representing a Boolean value/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                //Should throw error before calling core.isBoolean
                expect( isBooleanStub.callCount ).to.equal( 0 );
            });

            it( 'should execute output.throwError, which throws an error, if core.isBoolean returns false', function() {
                isBooleanStub.returns( false );

                expect( function() { commands.setWebAliasVerbose( 'randomValue' ) } ).to.throw( Error, /You must provide a string representing a Boolean value/ );

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

                commands.setWebAliasVerbose( 'true' );
                expect( isBooleanStub.callCount ).to.equal( 1 );
                expect( booleanValueStub.callCount ).to.equal( 1 );
                expect( jsonResult.verbose ).to.equal( true );

                commands.setWebAliasVerbose( 'false' );
                expect( isBooleanStub.callCount ).to.equal( 2 );
                expect( booleanValueStub.callCount ).to.equal( 2 );
                expect( jsonResult.verbose ).to.equal( false );

            });

            it( 'should execute output.passError in its callback function', function() {
                isBooleanStub.returns( true );
                booleanValueStub.withArgs( 'true' ).returns( true );

                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.setWebAliasVerbose( 'true' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            });
        });
    });

    describe( 'setDefaultBrowser', function() {
        it( 'should throw an error if no browser argument provided', function() {
            expect( function() { commands.setDefaultBrowser() } ).to.throw( Error, /You must provide the name of a browser or 'default'./ );
            expect( throwErrorStub.callCount ).to.equal( 1 );
        });

        it( 'should set data.defaultBrowser to "" if argument value is "default"', function() {
            fs.writeFile = function( dataFile, jsonString, callback ) {
                jsonResult = JSON.parse( jsonString );
            };
            commands.setDefaultBrowser( 'default' );
            expect( jsonResult.defaultBrowser ).to.equal( '' );
        });

        it( 'should set data.defaultBrowser to argument value if value not "default"', function() {
            fs.writeFile = function( dataFile, jsonString, callback ) {
                jsonResult = JSON.parse( jsonString );
            };
            commands.setDefaultBrowser( 'chrome' );
            expect( jsonResult.defaultBrowser ).to.equal( 'chrome' );
        });
    });

    describe( 'getDefaultBrowser', function() {

        after( function() {
            data.defaultBrowser = '';
        });

        it( 'should execute output.msg with explanatory text', function() {
            commands.getDefaultBrowser();
            expect( msgStub.callCount ).to.equal( 1 );
            expect( msgStub.args[ 0 ][ 0 ] ).to.contain( 'The current default browser for opening web pages with a command is:' );
        });

        it( 'should refer to a data.defaultBrowser value of "" as the "System default browser"', function() {
            data.defaultBrowser = '';
            commands.getDefaultBrowser();
            expect( msgStub.callCount ).to.equal( 1 );
            expect( msgStub.args[ 0 ][ 0 ] ).to.contain( 'command is: System default browser' );
        });

        it( 'should return the data.defaultBrowser value as is if not the default', function() {
            data.defaultBrowser = 'chrome';
            commands.getDefaultBrowser();
            expect( msgStub.callCount ).to.equal( 1 );
            expect( msgStub.args[ 0 ][ 0 ] ).to.contain( 'command is: chrome' );
        });

    });

    describe( 'createWebAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {};
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or url argument', function() {
                expect( function() { commands.createWebAlias() } ).to.throw( Error, /The web alias name and url parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.createWebAlias( 'foo' ) } ).to.throw( Error, /The web alias name and url parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias exists in data.aliases', function() {
                data.aliases = {
                    firstAlias: { url: 'http://google.com', browser: 'default' },
                    secondAlias: [ { url: 'http://www.nodejs.org', browser: 'default' } ]
                };

                expect( function() { commands.createWebAlias( 'firstAlias', 'http://google.com' ) } ).to.throw( Error, /'firstAlias' already exists; use updateWebAlias or deleteWebAlias/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.createWebAlias( 'secondAlias', 'http://nodejs.org' ) } ).to.throw( Error, /'secondAlias' already exists as an alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should add the alias with the specified url and "default" for the browser if no browser value provided and execute writeFile if legal function call', function () {
                var jsonResult;

                //Test pre-execution conditions
                expect( data.aliases ).to.not.have.property( 'goodAlias' );

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.createWebAlias( 'goodAlias', 'http://google.com' );

                expect( data.aliases ).to.have.property( 'goodAlias' );
                expect( jsonResult.aliases ).to.have.property( 'goodAlias' );
                expect( data.aliases.goodAlias ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
                expect( jsonResult.aliases.goodAlias ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
            } );

            it( 'should add the alias with the specified url and specified browser value and execute writeFile if legal function call', function () {
                var jsonResult;

                //Test pre-execution conditions
                expect( data.aliases ).to.not.have.property( 'goodAlias' );

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.createWebAlias( 'goodAlias', 'http://google.com', 'chrome' );

                expect( data.aliases ).to.have.property( 'goodAlias' );
                expect( jsonResult.aliases ).to.have.property( 'goodAlias' );
                expect( data.aliases.goodAlias ).to.deep.equal( { url: 'http://google.com', browser: 'chrome' } );
                expect( jsonResult.aliases.goodAlias ).to.deep.equal( { url: 'http://google.com', browser: 'chrome' } );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.createWebAlias( 'goodAlias', 'http://google.com' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.createWebAlias( 'goodAlias1', 'http://google.com' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.createWebAlias( 'goodAlias2', 'http://google.com' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.createWebAlias( 'goodAlias3', 'http://google.com' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Web alias 'goodAlias3' set to 'http://google.com' (default).")
            } );
        });
    });

    describe( 'updateWebAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                aliasToChange: { url: 'http://google.com', browser: 'default' },
                secondAlias: [ { url: 'http://www.nodejs.org', browser: 'default' } ]
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or url argument', function() {
                expect( function() { commands.updateWebAlias() } ).to.throw( Error, /The web alias name and url parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateWebAlias( 'aliasToChange' ) } ).to.throw( Error, /The web alias name and url parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.updateWebAlias( 'notThere', 'http:\\notthere.org' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if the alias specified belongs to an alias set', function() {
                expect( function() { commands.updateWebAlias( 'secondAlias', 'http:\\changed.org' ) } ).to.throw( Error, /belongs to an web alias set; use updateWebAliasSet to modify./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

        });

        describe( 'under success conditions', function() {
            it( 'should only update the alias url with the specified url in data.aliases if no browser argument provided and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.updateWebAlias( 'aliasToChange', 'http://changed.org' );

                expect( data.aliases ).to.have.property( 'aliasToChange' );
                expect( jsonResult.aliases ).to.have.property( 'aliasToChange' );
                expect( data.aliases.aliasToChange ).to.deep.equal( { url: 'http://changed.org', browser: 'default' } );
                expect( jsonResult.aliases.aliasToChange ).to.deep.equal( { url: 'http://changed.org', browser: 'default' } );
            } );

            it( 'should update the alias url and browser in data.aliases with the corresponding argument values and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.updateWebAlias( 'aliasToChange', 'http://changed.org', 'chrome' );

                expect( data.aliases ).to.have.property( 'aliasToChange' );
                expect( jsonResult.aliases ).to.have.property( 'aliasToChange' );
                expect( data.aliases.aliasToChange ).to.deep.equal( { url: 'http://changed.org', browser: 'chrome' } );
                expect( jsonResult.aliases.aliasToChange ).to.deep.equal( { url: 'http://changed.org', browser: 'chrome' } );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.updateWebAlias( 'aliasToChange', 'http://changed.org' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateWebAlias( 'aliasToChange', 'http://changed.org' );
                expect( data.aliases.aliasToChange.url ).to.equal( 'http://changed.org' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.updateWebAlias( 'aliasToChange', 'http://changed2.org' );
                expect( data.aliases.aliasToChange.url ).to.equal( 'http://changed2.org' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateWebAlias( 'aliasToChange', 'http://changed3.org' );
                expect( data.aliases.aliasToChange.url ).to.equal( 'http://changed3.org' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Web alias 'aliasToChange' updated to 'http://changed3.org' (default).")
            } );
        });
    });

    describe( 'renameWebAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                aliasToRename: { url: 'http://google.com', browser: 'default' },
                setAlias: [ { url: 'http://www.nodejs.org', browser: 'default' } ]
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or url argument', function() {
                expect( function() { commands.renameWebAlias() } ).to.throw( Error, /The current and new web alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.renameWebAlias( 'foo' ) } ).to.throw( Error, /The current and new web alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if currentAlias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.renameWebAlias( 'notThere', 'newAliasName' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is alias set', function() {
                expect( function() { commands.renameWebAlias( 'setAlias', 'newAliasName' ) } ).to.throw( Error, /'setAlias' belongs to a web alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should update the alias name in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.renameWebAlias( 'aliasToRename', 'newAliasName' );

                expect( data.aliases ).to.not.have.property( 'aliasToRename' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasToRename' );
                expect( jsonResult.aliases ).to.have.property( 'newAliasName' );
                expect( data.aliases.newAliasName.url ).to.equal( 'http://google.com' );
                expect( jsonResult.aliases.newAliasName.url ).to.equal( 'http://google.com' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.renameWebAlias( 'aliasToRename', 'newAliasName' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameWebAlias( 'aliasToRename', 'newAliasName' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.renameWebAlias( 'newAliasName', 'secondName' );
                expect( data.aliases ).to.have.property( 'secondName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameWebAlias( 'secondName', 'thirdName' );
                expect( data.aliases ).to.have.property( 'thirdName' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Web alias 'secondName' renamed to 'thirdName'." );
            } );
        });
    });

    describe( 'deleteBatchAlias', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                aliasToDelete: 'http://google.com' ,
                secondAlias: [ { url: 'http://www.nodejs.org', browser: 'default' } ]
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { commands.deleteWebAlias() } ).to.throw( Error, /The web alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.deleteWebAlias( 'notThere' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias refers to an alias set', function() {
                expect( function() { commands.deleteWebAlias( 'secondAlias' ) } ).to.throw( Error, /belongs to an web alias set; use deleteWebAliasSet to delete./ );
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

                commands.deleteWebAlias( 'aliasToDelete' );

                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasToDelete' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.deleteWebAlias( 'aliasToDelete' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                expect( data.aliases ).to.have.property( 'aliasToDelete' );

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteWebAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasToDelete: 'http://google.com' };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.deleteWebAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasToDelete: 'http://google.com' };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteWebAlias( 'aliasToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasToDelete' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Web alias 'aliasToDelete' deleted.")
            } );
        });
    });

    describe( 'updateWebAliasBrowser', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                aliasToChange: { url: 'http://original.com', browser: 'default' },
                secondAlias: [ { url: 'http://www.nodejs.org', browser: 'default' } ]
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or url argument', function() {
                expect( function() { commands.updateWebAliasBrowser() } ).to.throw( Error, /The web alias name and browser parameters must be defined/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateWebAliasBrowser( 'aliasToChange' ) } ).to.throw( Error, /The web alias name and browser parameters must be defined/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.updateWebAliasBrowser( 'notThere', 'http:\\notthere.org' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if the alias specified belongs to an alias set', function() {
                expect( function() { commands.updateWebAliasBrowser( 'secondAlias', 'http:\\changed.org' ) } ).to.throw( Error, /belongs to an web alias set; use updateWebAliasSet to modify./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

        });

        describe( 'under success conditions', function() {
            it( 'should only update the browser value for the alias and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.updateWebAliasBrowser( 'aliasToChange', 'firefox' );

                expect( data.aliases ).to.have.property( 'aliasToChange' );
                expect( jsonResult.aliases ).to.have.property( 'aliasToChange' );
                expect( data.aliases.aliasToChange ).to.deep.equal( { url: 'http://original.com', browser: 'firefox' } );
                expect( jsonResult.aliases.aliasToChange ).to.deep.equal( { url: 'http://original.com', browser: 'firefox' } );
            } );


            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.updateWebAliasBrowser( 'aliasToChange', 'firefox' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateWebAliasBrowser( 'aliasToChange', 'firefox' );
                expect( data.aliases.aliasToChange.browser ).to.equal( 'firefox' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.updateWebAliasBrowser( 'aliasToChange', 'chrome' );
                expect( data.aliases.aliasToChange.browser ).to.equal( 'chrome' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.updateWebAliasBrowser( 'aliasToChange', 'opera' );
                expect( data.aliases.aliasToChange.browser ).to.equal( 'opera' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Browser for web alias 'aliasToChange' updated to 'opera'.")
            } );
        });
    });


    describe( 'createWebAliasSet', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {};
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or filepath argument', function() {
                expect( function() { commands.createWebAliasSet() } ).to.throw( Error, /The web alias name and url parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.createWebAliasSet( 'foo' ) } ).to.throw( Error, /The web alias name and url parameters must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if alias exists in data.aliases', function() {
                data.aliases = {
                    firstAlias: { url: 'http://google.com', browser: 'default' },
                    secondAlias: [ { url: 'http://www.nodejs.org', browser: 'default' } ]
                };

                expect( function() { commands.createWebAliasSet( 'firstAlias', 'http://google.com' ) } ).to.throw( Error, /'firstAlias' already exists; use updateWebAlias or deleteWebAlias/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( function() { commands.createWebAliasSet( 'secondAlias', 'http://google.com' ) } ).to.throw( Error, /'secondAlias' already exists as an web alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should add the alias array to data.aliases with specified url and a "default" browser when no browser specified and execute writeFile if legal function call', function () {
                var jsonResult;

                //Test pre-execution conditions
                expect( data.aliases ).to.not.have.property( 'goodAliasSet' );

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.createWebAliasSet( 'goodAliasSet', 'http://google.com' );

                expect( data.aliases ).to.have.property( 'goodAliasSet' );
                expect( jsonResult.aliases ).to.have.property( 'goodAliasSet' );

                expect( data.aliases.goodAliasSet ).to.be.a( 'array' );
                expect( jsonResult.aliases.goodAliasSet ).to.be.a( 'array' );

                expect( data.aliases.goodAliasSet.length ).to.equal( 1 );
                expect( jsonResult.aliases.goodAliasSet.length ).to.equal( 1 );

                expect( data.aliases.goodAliasSet[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
                expect( jsonResult.aliases.goodAliasSet[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
            } );

            it( 'should add the alias array to data.aliases with specified url and specified browser and execute writeFile if legal function call', function () {
                var jsonResult;

                //Test pre-execution conditions
                expect( data.aliases ).to.not.have.property( 'goodAliasSet' );

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                }

                commands.createWebAliasSet( 'goodAliasSet', 'http://google.com', 'chrome' );

                expect( data.aliases ).to.have.property( 'goodAliasSet' );
                expect( jsonResult.aliases ).to.have.property( 'goodAliasSet' );

                expect( data.aliases.goodAliasSet ).to.be.a( 'array' );
                expect( jsonResult.aliases.goodAliasSet ).to.be.a( 'array' );

                expect( data.aliases.goodAliasSet.length ).to.equal( 1 );
                expect( jsonResult.aliases.goodAliasSet.length ).to.equal( 1 );

                expect( data.aliases.goodAliasSet[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'chrome' } );
                expect( jsonResult.aliases.goodAliasSet[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'chrome' } );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.createWebAliasSet( 'goodAliasSet', 'http://google.com' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } )

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.createWebAliasSet( 'goodAliasSet1', 'http://google.com' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.createWebAliasSet( 'goodAliasSet2', 'http://google.com' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.createWebAliasSet( 'goodAliasSet3', 'http://google.com' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Web alias set 'goodAliasSet3' created with first URL set to 'http://google.com' (default)." );
            } )
        });
    });


    describe( 'updateWebAliasSet', function() {

        var originalAliasSet;

        beforeEach( function() {
            delete data.verbose;
            originalAliasSet = [
                { url: 'http://google.com', browser: 'default' },
                { url: 'http://nodejs.org', browser: 'default' },
                { url: 'http://google.com', browser: 'chrome' }
            ]
            data.aliases = {
                aliasSetToUpdate: originalAliasSet,
                singleAlias: { url: 'http://microsoft.com', browser: 'default' }
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias, action, or urlOrIndex argument', function() {
                var expectedMsg = "The alias name, action ('add', 'url', 'browser' or 'delete') and url/alias index parameters must be defined.";
                expect( function() { commands.updateWebAliasSet() } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 2 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'add' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 3 );
                //Confirm aliasSet not altered
                expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );
            });

            it( 'should execute output.throwError if action is not "add", "url", "browser" or "delete"', function() {
                var expectedMsg = "The action must be either 'add', 'url', 'browser' or 'delete'.";
                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'append', 'http:\\mozilla.org' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'address', 'http:\\mozilla.org' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 2 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'client', 'http:\\mozilla.org', 'firefox' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 3 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'remove', 'http:\\mozilla.org' ) } ).to.throw( Error, expectedMsg );
                expect( throwErrorStub.callCount ).to.equal( 4 );

                //Confirm aliasSet not altered
                expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );
            });

            it( 'should execute output.throwError with appropriate message if action is "url" or "browser" and replacement value not supplied', function() {
                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 'http://nodejs.org' ) } ).to.throw( Error, /you must provide both a url/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 'http://nodejs.org' ) } ).to.throw( Error, /you must provide both a url/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.updateWebAliasSet( 'notThere', 'delete', 'C:\\' ) } ).to.throw( Error, /'notThere' not found; use createWebAliasSet to create./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is regular alias', function() {
                data.aliases.singleAlias = 'C:\\';

                expect( function() { commands.updateWebAliasSet( 'singleAlias', 'add', 'http://mozilla.org' ) } ).to.throw( Error, /'singleAlias' does not match a web alias set./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if action is "url" or "browser" but specified url not present in alias set', function() {
                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 'http://notThere.com', 'http://somewhere.org' ); } ).to.throw( Error, /not found in alias set 'aliasSetToUpdate'/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 'http://notThere.com', 'firefox' ); } ).to.throw( Error, /not found in alias set 'aliasSetToUpdate'/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });

            it( 'should execute output.throwError with appropriate message if action is "url" or "browser" but specified array index not present in alias set', function() {
                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 4, 'http://somewhere.org' ); } ).to.throw( Error, /not found in alias set 'aliasSetToUpdate'/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 4, 'firefox' ); } ).to.throw( Error, /not found in alias set 'aliasSetToUpdate'/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
            });

        });

        describe( 'under success conditions', function() {

            describe( 'with "add" action', function() {
                it( 'should add new alias to array with specified url and a "default" browser when no browser specified and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 3 );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'add', 'http://microsoft.com' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 4 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 4 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( originalAliasSet[ 0 ] );
                    expect( data.aliases.aliasSetToUpdate[ 3 ] ).to.deep.equal( { url: 'http://microsoft.com', browser: 'default' } );
                } );

                it( 'should add new alias to array with specified url and specified browser and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 3 );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'add', 'http://microsoft.com', 'iexplore' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 4 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 4 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( originalAliasSet[ 0 ] );
                    expect( data.aliases.aliasSetToUpdate[ 3 ] ).to.deep.equal( { url: 'http://microsoft.com', browser: 'iexplore' } );
                } );


                it( 'should execute output.passError in its callback function', function () {
                    fs.writeFile = sinon.stub();
                    fs.writeFile.callsArgWith( 2, null );

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'add', 'http://microsoft.com' );

                    expect( passErrorStub.callCount ).to.equal( 1 );
                } );

                it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                    fs.writeFile = sinon.stub();

                    booleanValueStub.returns( false );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'add', 'http://microsoft.com' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'add', 'http://microsoft.com' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'add', 'http://microsoft.com' );
                    expect( successStub.callCount ).to.equal( 1 );
                    expect( successStub.args[ 0 ][ 0 ] ).to.equal( "URL 'http://microsoft.com' (default) added to alias set 'aliasSetToUpdate'." );
                } );
            });

            describe( 'with "url" action', function() {
                it( 'should update the url of the last alias with a matching url in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 'http://google.com', 'http://microsoft.com' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 3 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 3 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
                    expect( data.aliases.aliasSetToUpdate[ 2 ] ).to.deep.equal( { url: 'http://microsoft.com', browser: 'chrome' } );
                } );

                it( 'should update the url of the alias at the specified index position in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 0, 'http://microsoft.com' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 3 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 3 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( { url: 'http://microsoft.com', browser: 'default' } );
                    expect( data.aliases.aliasSetToUpdate[ 2 ] ).to.deep.equal( { url: 'http://google.com', browser: 'chrome' } );
                } );

                it( 'should execute output.passError in its callback function', function () {
                    fs.writeFile = sinon.stub();
                    fs.writeFile.callsArgWith( 2, null );

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 'http://google.com', 'http://microsoft.com' );

                    expect( passErrorStub.callCount ).to.equal( 1 );
                } )

                it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                    fs.writeFile = sinon.stub();

                    booleanValueStub.returns( false );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 'http://nodejs.org', 'http://microsoft.com' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 'http://microsoft.com', 'http://apple.com' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'url', 'http://apple.com', 'http://amazon.com' );
                    expect( successStub.callCount ).to.equal( 1 );
                    expect( successStub.args[ 0 ][ 0 ] ).to.equal( "URL alias instance 'http://apple.com' URL changed to 'http://amazon.com' (default)." );

                    expect( data.aliases.aliasSetToUpdate[ 1 ] ).to.deep.equal( { url: 'http://amazon.com', browser: 'default' } );
                } )
            });

            describe( 'with "browser" action', function() {
                it( 'should update the browser of the last alias with a matching url in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 'http://google.com', 'firefox' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 3 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 3 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
                    expect( data.aliases.aliasSetToUpdate[ 2 ] ).to.deep.equal( { url: 'http://google.com', browser: 'firefox' } );
                } );

                it( 'should update the browser of the alias at the specified index position in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 0, 'firefox' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 3 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 3 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'firefox' } );
                    expect( data.aliases.aliasSetToUpdate[ 2 ] ).to.deep.equal( { url: 'http://google.com', browser: 'chrome' } );
                } );

                it( 'should execute output.passError in its callback function', function () {
                    fs.writeFile = sinon.stub();
                    fs.writeFile.callsArgWith( 2, null );

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 'http://google.com', 'firefox' );

                    expect( passErrorStub.callCount ).to.equal( 1 );
                } );

                it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                    fs.writeFile = sinon.stub();

                    booleanValueStub.returns( false );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 'http://nodejs.org', 'chrome' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 'http://nodejs.org', 'iexplore' );
                    expect( successStub.callCount ).to.equal( 0 );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'browser', 'http://nodejs.org', 'firefox' );
                    expect( successStub.callCount ).to.equal( 1 );
                    expect( successStub.args[ 0 ][ 0 ] ).to.equal( "URL alias instance 'http://nodejs.org' changed to use browser 'firefox'." );

                    expect( data.aliases.aliasSetToUpdate[ 1 ] ).to.deep.equal( { url: 'http://nodejs.org', browser: 'firefox' } );
                } );
            });

            describe( 'with "delete" action', function() {
                it( 'should delete the last alias of the targeted url in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'delete', 'http://google.com' );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 2 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 2 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
                    expect( data.aliases.aliasSetToUpdate[ 1 ] ).to.deep.equal( { url: 'http://nodejs.org', browser: 'default' } );
                } );

                it( 'should delete the alias at the specified index in the alias set and execute writeFile if legal function call', function () {
                    var jsonResult;

                    //Test pre-execution conditions
                    expect( data.aliases.aliasSetToUpdate ).to.deep.equal( originalAliasSet );

                    fs.writeFile = function ( dataFile, jsonString, callback ) {
                        jsonResult = JSON.parse( jsonString );
                    }

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'delete', 0 );

                    expect( data.aliases ).to.have.property( 'aliasSetToUpdate' );
                    expect( jsonResult.aliases ).to.have.property( 'aliasSetToUpdate' );

                    expect( data.aliases.aliasSetToUpdate ).to.be.a( 'array' );
                    expect( jsonResult.aliases.aliasSetToUpdate ).to.be.a( 'array' );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 2 );
                    expect( jsonResult.aliases.aliasSetToUpdate.length ).to.equal( 2 );

                    expect( data.aliases.aliasSetToUpdate[ 0 ] ).to.deep.equal( { url: 'http://nodejs.org', browser: 'default' } );
                    expect( data.aliases.aliasSetToUpdate[ 1 ] ).to.deep.equal( { url: 'http://google.com', browser: 'chrome' } );

                } );

                it( 'should execute output.passError in its callback function', function () {
                    fs.writeFile = sinon.stub();
                    fs.writeFile.callsArgWith( 2, null );

                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'delete', 'http://nodejs.org' );

                    expect( passErrorStub.callCount ).to.equal( 1 );
                } );

                it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                    fs.writeFile = sinon.stub();

                    booleanValueStub.returns( false );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'delete', 'http://nodejs.org' );
                    expect( successStub.callCount ).to.equal( 0 );

                    //Reset
                    data.aliases.aliasSetToUpdate.push( { url: 'http://nodejs.org', browser: 'default' } );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'delete', 'http://nodejs.org' );
                    expect( successStub.callCount ).to.equal( 0 );

                    //Reset
                    data.aliases.aliasSetToUpdate.push( { url: 'http://nodejs.org', browser: 'default' } );

                    booleanValueStub.returns( true );
                    fs.writeFile.callsArgWith( 2, null );
                    commands.updateWebAliasSet( 'aliasSetToUpdate', 'delete', 'http://nodejs.org' );
                    expect( successStub.callCount ).to.equal( 1 );
                    expect( successStub.args[ 0 ][ 0 ] ).to.equal( "URL alias instance 'http://nodejs.org' removed from alias set 'aliasSetToUpdate'." );

                    expect( data.aliases.aliasSetToUpdate.length ).to.equal( 2 );
                } );
            })

        });
    });

    describe( 'renameWebAliasSet', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                singleAlias: { url: 'http://google.com', browser: 'default' },
                aliasToRename: [ { url: 'http://www.nodejs.org', browser: 'default' } ]
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias or url argument', function() {
                expect( function() { commands.renameWebAliasSet() } ).to.throw( Error, /The current and new web alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );

                expect( function() { commands.renameWebAliasSet( 'foo' ) } ).to.throw( Error, /The current and new web alias names must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                //Confirm alias not created
                expect( data.aliases ).to.not.have.property( 'foo' );
            });

            it( 'should execute output.throwError with appropriate message if currentAlias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.renameWebAliasSet( 'notThere', 'newAliasName' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is alias set', function() {
                expect( function() { commands.renameWebAliasSet( 'singleAlias', 'newAliasName' ) } ).to.throw( Error, /'singleAlias' does not match a web alias set/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should update the alias name in data.aliases and execute writeFile if legal function call', function () {
                var jsonResult;

                fs.writeFile = function ( dataFile, jsonString, callback ) {
                    jsonResult = JSON.parse( jsonString );
                };

                commands.renameWebAliasSet( 'aliasToRename', 'newAliasName' );

                expect( data.aliases ).to.not.have.property( 'aliasToRename' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasToRename' );
                expect( jsonResult.aliases ).to.have.property( 'newAliasName' );
                expect( data.aliases.newAliasName[ 0 ].url ).to.equal( 'http://www.nodejs.org' );
                expect( jsonResult.aliases.newAliasName[ 0 ].url ).to.equal( 'http://www.nodejs.org' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.renameWebAliasSet( 'aliasToRename', 'newAliasName' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameWebAliasSet( 'aliasToRename', 'newAliasName' );
                expect( data.aliases ).to.have.property( 'newAliasName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.renameWebAliasSet( 'newAliasName', 'secondName' );
                expect( data.aliases ).to.have.property( 'secondName' );
                expect( successStub.callCount ).to.equal( 0 );

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.renameWebAliasSet( 'secondName', 'thirdName' );
                expect( data.aliases ).to.have.property( 'thirdName' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Web alias set 'secondName' renamed to 'thirdName'." );
            } );
        });
    });
    
    describe( 'deleteWebAliasSet', function() {

        beforeEach( function() {
            delete data.verbose;
            data.aliases = {
                aliasSetToDelete: [ { url: 'http://google.com', browser: 'default' } ],
                singleAlias: { url: 'http://nodejs.org', browser: 'chrome' }
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { commands.deleteWebAliasSet() } ).to.throw( Error, /The alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.deleteWebAliasSet( 'notThere' ) } ).to.throw( Error, /'notThere' not found./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError with appropriate message if alias exists but is regular alias', function() {
                expect( function() { commands.deleteWebAliasSet( 'singleAlias' ) } ).to.throw( Error, /'singleAlias' does not match a web alias set./ );
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

                commands.deleteWebAliasSet( 'aliasSetToDelete' );

                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( jsonResult.aliases ).to.not.have.property( 'aliasSetToDelete' );
            } );

            it( 'should execute output.passError in its callback function', function () {
                fs.writeFile = sinon.stub();
                fs.writeFile.callsArgWith( 2, null );

                commands.deleteWebAliasSet( 'aliasSetToDelete' );

                expect( passErrorStub.callCount ).to.equal( 1 );
            } );

            it( 'should execute output.success in its callback function if no error and data.verbose == true', function () {
                fs.writeFile = sinon.stub();

                expect( data.aliases ).to.have.property( 'aliasSetToDelete' );

                booleanValueStub.returns( false );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteWebAliasSet( 'aliasSetToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasSetToDelete: [ { url: 'http://google.com', browser: 'default' } ] };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, new Error( 'failure' ) );
                commands.deleteWebAliasSet( 'aliasSetToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( successStub.callCount ).to.equal( 0 );

                //Reset
                data.aliases = { aliasSetToDelete: [ { url: 'http://google.com', browser: 'default' } ] };

                booleanValueStub.returns( true );
                fs.writeFile.callsArgWith( 2, null );
                commands.deleteWebAliasSet( 'aliasSetToDelete' );
                expect( data.aliases ).to.not.have.property( 'aliasSetToDelete' );
                expect( successStub.callCount ).to.equal( 1 );
                expect( successStub.args[ 0 ][ 0 ] ).to.equal( "Web alias set 'aliasSetToDelete' deleted." );

            } );
        });
    });

    describe( 'showWebsites', function() {

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
            commands.showWebsites();
            expect( logStub.callCount ).to.equal( 1 );
            expect( logStub.args.length ).to.equal( 1 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current website loading aliases:' );
        });

        it( 'for a single alias, should return one line with alias name, url and browser', function() {
            data.aliases = { aliasA: { url: 'http://google.com', browser: 'default' } }
            commands.showWebsites();
            expect( logStub.callCount ).to.equal( 2 );
            expect( logStub.args.length ).to.equal( 2 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current website loading aliases:' );
            expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'aliasA: http://google.com (default)' );
        });

        it( 'for an alias set, should return one line for the alias name, one line for each path, and then an empty line', function() {
            data.aliases = { aliasSetA: [
                { url: 'http://google.com', browser: 'default' },
                { url: 'http://nodejs.org', browser: 'chrome' }
            ] };
            commands.showWebsites();
            expect( logStub.callCount ).to.equal( 5 );
            expect( logStub.args.length ).to.equal( 5 );
            expect( logStub.args[ 0 ][ 0 ] ).to.equal( 'Current website loading aliases:' );
            expect( logStub.args[ 1 ][ 0 ] ).to.equal( 'aliasSetA:' );
            expect( logStub.args[ 2 ][ 0 ] ).to.equal( '   http://google.com (default)' );
            expect( logStub.args[ 3 ][ 0 ] ).to.equal( '   http://nodejs.org (chrome)' );
            expect( logStub.args[ 4 ][ 0 ] ).to.equal( '' );
        });
    });

    describe( 'getWebAlias', function() {
        beforeEach( function() {
            data.aliases = {
                singleAlias: { url: 'http://google.com', browser: 'default' } ,
                aliasSet: [
                    { url: 'http://google.com', browser: 'default' },
                    { url: 'http://nodejs.org', browser: 'chrome' }
                ]
            };
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { hooks.getWebAlias() } ).to.throw( Error, /The web alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });

            it( 'should execute output.throwError if alias not found', function() {
                expect( function() { hooks.getWebAlias( 'notThere' ) } ).to.throw( Error, /Web alias 'notThere' not found./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
            });
        });

        describe( 'under success conditions', function() {
            it( 'should return the alias object for a non-set alias', function() {
                var aliasValue = hooks.getWebAlias( 'singleAlias' );
                expect( aliasValue ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
            });

            it( 'should return the alias array for an alias set', function() {
                var aliasValue = hooks.getWebAlias( 'aliasSet' );
                expect( aliasValue ).to.deep.equal( [
                    { url: 'http://google.com', browser: 'default' },
                    { url: 'http://nodejs.org', browser: 'chrome' }
                ]);
            });
        });
    });

    describe( 'web', function() {

        var execStub,
            executionStringStub,
            executeBrowseRevert;

        beforeEach( function() {
            execStub = sinon.stub( childProcess, 'exec', function( statement, callback ) { callback(); } );
            executionStringStub = sinon.stub( hooks, 'getBrowserExecutionString', function( alias ) { return 'start chrome http://righton.org' })
            executeBrowseRevert =
            data.aliases = {
                singleAlias: { url: 'http://google.com', browser: 'default' } ,
                aliasSet: [
                    { url: 'http://google.com', browser: 'default' },
                    { url: 'http://nodejs.org', browser: 'chrome' }
                ]
            };
        });

        afterEach( function() {
            execStub.restore();
            executionStringStub.restore();
        });

        describe( 'under failure conditions', function() {
            it( 'should execute output.throwError, which throws an error, if no alias argument', function() {
                expect( function() { commands.web() } ).to.throw( Error, /The web alias parameter must be defined./ );
                expect( throwErrorStub.callCount ).to.equal(1);
            });

            it( 'should execute output.throwError with appropriate message if alias does not exist in data.aliases', function() {
                expect( data.aliases ).to.not.have.property( 'notThere' );

                expect( function() { commands.web( 'notThere' ) } ).to.throw( Error, /'notThere' not found/ );
                expect( throwErrorStub.callCount ).to.equal(1);
            });

        });

        describe( 'under success conditions', function() {

            it( 'should execute getBrowserExecutionString, passing in the alias data', function () {
                commands.web( 'singleAlias' );

                expect( executionStringStub.callCount ).to.equal( 1 );
                expect( executionStringStub.args[ 0 ][ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
            } );

            it( 'should execute getBrowserExecutionString once per alias item in an alias set', function () {
                commands.web( 'aliasSet' );

                expect( executionStringStub.callCount ).to.equal( 2 );
                expect( executionStringStub.args[ 0 ][ 0 ] ).to.deep.equal( { url: 'http://google.com', browser: 'default' } );
                expect( executionStringStub.args[ 1 ][ 0 ] ).to.deep.equal( { url: 'http://nodejs.org', browser: 'chrome' } );
            } );

            it( 'should execute exec with the result of getBrowserExecutionString', function() {
                commands.web( 'singleAlias' );

                expect( execStub.callCount ).to.equal( 1 );
                expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start chrome http://righton.org' );
            });

            it( 'should execute output.passError in its callback function', function () {
                commands.web( 'singleAlias' );

                expect( execStub.callCount ).to.equal( 1 );
                expect( executionStringStub.callCount ).to.equal( 1 );
                expect( passErrorStub.callCount ).to.equal( 1 );
            } );
        })
    });
});