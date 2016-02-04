var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

describe( 'core', function() {

    var introspect,
        os,
        output,
        fp,
        core;

    before( function() {
        introspect = sinon.stub();
        os = sinon.stub();
        output = sinon.stub();
        fp = sinon.stub();

        core = proxyquire( '../core', {
            'introspect': introspect,
            'os': os,
            './output': output,
            '../cmdModules/core/filePath/commands': fp
        });

    });

    describe( 'generateCommandPrompt', function() {
        var sourceAliasStub, targetAliasStub;

        beforeEach( function() {
            targetAliasStub = sinon.stub( fp.hooks, 'getTargetAlias', function() { return 'targetDir' } );
        });

        afterEach( function() {
           targetAliasStub.restore();
           sourceAliasStub.restore();
        });

        it( 'should start with a source alias if a source is set', function() {
            sourceAliasStub = sinon.stub( fp.hooks, 'getSourceAlias', function() { return 'srcDir' } );
            var result = core.generateCommandPrompt();
            expect( result ).to.match( /^source \-\> srcDir/ );
        });

        it( 'should have no source if no source is set', function() {
            sourceAliasStub = sinon.stub( fp.hooks, 'getSourceAlias', function() {} );
            var result = core.generateCommandPrompt();
            expect( result ).to.not.contain( 'source ->' );
        });

        it( 'should always include the target directory at the end', function() {
            sourceAliasStub = sinon.stub( fp.hooks, 'getSourceAlias', function() { return 'srcDir' } );
            var result = core.generateCommandPrompt();
            expect( result ).to.match( /target \-\> targetDir \>\>$/ );

            sourceAliasStub.restore();

            sourceAliasStub = sinon.stub( fp.hooks, 'getSourceAlias', function() {} );
            var resultNoSource = core.generateCommandPrompt();
            expect( resultNoSource ).to.match( /target \-\> targetDir \>\>$/ );
        });

    });

    describe( 'escapeRegExp', function() {
       it( 'escapes regex-unfriendly characters in the string', function() {
           var result;
           var expectationSet = [
               { arg: '[ "1", "2" ]', result: '\\[ \"1\", \"2\" \\]' },
               { arg: 'C:\\code-node', result: 'C:\\\\code\\-node' },
               { arg: 'function() { return true }', result: 'function\\(\\) \\{ return true \\}' }
           ];

           for( var e = 0; e < expectationSet.length; e++ ) {
               result = core.escapeRegExp( expectationSet[ e ].arg );
               expect( result ).to.equal( expectationSet[ e ].result, 'Test for argument "' + expectationSet[ e ].arg + '" failed.' );
           }
       });
    });

    describe( 'isBoolean', function() {
        it( 'should only return true for an integer/string argument commonly recognized as boolean', function() {
           var result;
           var expectationSet = [
               { arg: 1, result: true },
               { arg: 0, result: true },
               { arg: 2, result: false },
               { arg: '1', result: true },
               { arg: '0', result: true },
               { arg: '2', result: false },
               { arg: 'true', result: true },
               { arg: 'false', result: true },
               { arg: 'True', result: true },
               { arg: 'False', result: true },
               { arg: 'T', result: false },
               { arg: 'yes', result: true },
               { arg: 'no', result: true },
               { arg: 'Yes', result: true },
               { arg: 'No', result: true },
               { arg: 'y', result: true },
               { arg: 'n', result: true },
               { arg: 'Y', result: true },
               { arg: 'N', result: true }
           ];

           for( var e = 0; e < expectationSet.length; e++ ) {
               result = core.isBoolean( expectationSet[ e ].arg );
               expect( result ).to.equal( expectationSet[ e ].result, 'Test for argument "' + expectationSet[ e ].arg + '" failed.' );
           }

        });
    });

    describe( 'booleanValue', function() {
        it( 'should return true if the argument translates to a common true boolean, and false if not', function() {
            var result;
            var expectationSet = [
                { arg: true, result: true },
                { arg: false, result: false },
                { arg: 1, result: true },
                { arg: 0, result: false },
                { arg: 2, result: false },
                { arg: '1', result: true },
                { arg: '0', result: false },
                { arg: '2', result: false },
                { arg: 'true', result: true },
                { arg: 'false', result: false },
                { arg: 'True', result: true },
                { arg: 'False', result: false },
                { arg: 'T', result: false },
                { arg: 'yes', result: true },
                { arg: 'no', result: false },
                { arg: 'Yes', result: true },
                { arg: 'No', result: false },
                { arg: 'y', result: true },
                { arg: 'n', result: false },
                { arg: 'Y', result: true },
                { arg: 'N', result: false }
            ];

            for( var e = 0; e < expectationSet.length; e++ ) {
                result = core.booleanValue( expectationSet[ e ].arg );
                expect( result ).to.equal( expectationSet[ e ].result, 'Test for argument "' + expectationSet[ e ].arg + '" failed.' );
            }
        });
    });

    describe( 'sortObjectProperties', function() {
       it( 'should return an object with the properties sorted alphabetically', function() {
           var originalObject = {
               z: 'last',
               s: 'secondToLast',
               m: 'middle',
               c: 'second',
               a: 'first'
           };

           var originalObjectProperties = [];
           for( var op in originalObject ) { originalObjectProperties.push( op ) }

           expect( originalObjectProperties[ 0 ] ).to.equal( 'z' );
           expect( originalObjectProperties[ 1 ] ).to.equal( 's' );
           expect( originalObjectProperties[ 4 ] ).to.equal( 'a' );

           var result;
           var resultProperties = [];

           var resultObj = core.sortObjectProperties( originalObject );
           for( var rp in resultObj ) { resultProperties.push( rp ) }

           expect( resultProperties[ 0 ] ).to.equal( 'a' );
           expect( resultProperties[ 1 ] ).to.equal( 'c' );
           expect( resultProperties[ 4 ] ).to.equal( 'z' );
       });
    });

    describe( 'transformQuotedValues', function() {
        it( 'removes all spaces in a quoted string segment with replacement string', function() {
            var result = core.transformQuotedValues( '"Simple quoted string"' );
            expect( result ).to.equal( 'Simple' + core.spaceReplacement + 'quoted' + core.spaceReplacement + 'string' );
        });

        it( 'preserves spaces outside of quotes', function() {
            var result = core.transformQuotedValues( '"quote 1" bareString "quote 2"' );
            expect( result ).to.equal( 'quote' + core.spaceReplacement + '1 bareString quote' + core.spaceReplacement + '2' );
        })

        it( 'removes double quotes of quoted segments', function() {
            var result = core.transformQuotedValues( '"quote 1" bareString "quote 2"' );
            expect( result ).to.equal( 'quote' + core.spaceReplacement + '1 bareString quote' + core.spaceReplacement + '2' );
        })
    });

    describe( 'parseNamedArguments', function() {

        it( 'maps the incoming array of key/value pairs to an ordered array of method signature arguments', function() {
            introspect.returns( [ 'arg1', 'arg2', 'arg3' ] );
            var incomingNamedArguments = [
                'arg3:last',
                'arg1:first',
                'arg2:second'
            ];

            var result = core.parseNamedArguments( incomingNamedArguments, function() {} );

            expect( result instanceof Array ).to.be.true;
            expect( result.length ).to.equal( 3 );
            expect( result[ 0 ] ).to.equal( 'first' );
            expect( result[ 1 ] ).to.equal( 'second' );
            expect( result[ 2 ] ).to.equal( 'last' );
        });

        it( 'preserves any colons in the argument value', function() {
            introspect.returns( [ 'arg1', 'arg2', 'arg3' ] );
            var incomingNamedArguments = [
                'arg3:some:colon:delimited:value',
                'arg1:C:\\filePath',
                'arg2:second'
            ];

            var result = core.parseNamedArguments( incomingNamedArguments, function() {} );

            expect( result instanceof Array ).to.be.true;
            expect( result.length ).to.equal( 3 );
            expect( result[ 0 ] ).to.equal( 'C:\\filePath' );
            expect( result[ 1 ] ).to.equal( 'second' );
            expect( result[ 2 ] ).to.equal( 'some:colon:delimited:value' );
        });

        it( 'sets any method signature argument values not represented in the key/value pairs to null', function() {
            introspect.returns( [ 'arg1', 'arg2', 'arg3', 'arg4' ] );
            var incomingNamedArguments = [
                'arg3:third',
                'arg1:first'
            ];

            var result = core.parseNamedArguments( incomingNamedArguments, function() {} );

            expect( result instanceof Array ).to.be.true;
            expect( result.length ).to.equal( 4 );
            expect( result[ 0 ] ).to.equal( 'first' );
            expect( result[ 1 ] ).to.equal( null );
            expect( result[ 2 ] ).to.equal( 'third' );
            expect( result[ 3 ] ).to.equal( null );
        });
    });

    describe( 'generateArgumentsArray', function() {

        var transformStub, namedParamsStub;

        beforeEach( function() {
            transformStub = sinon.stub( core, 'transformQuotedValues', function( argumentString ) {
                switch( argumentString ) {
                    case 'backup "C:\\My Documents\\backups" "D:\\My Documents\\backups"':
                        return 'backup C:\\My' + core.spaceReplacement + 'Documents\\backups D:\\My' + core.spaceReplacement +  'Documents\\backups';
                        break;

                    case '[alias:backup originalPath:"C:\\My Documents\\backups" newPath:"D:\\My Documents\\backups"]':
                        return '[alias:backup originalPath:C:\\My' + core.spaceReplacement + 'Documents\\backups newPath:D:\\My' + core.spaceReplacement + 'Documents\\backups]';
                        break;

                    default:
                        return argumentString
                }
            });

            namedParamsStub = sinon.stub( core, 'parseNamedArguments', function( argArray, cmdFunction ) {
                if( argArray[ 0 ] == 'alias:backup' ) {
                    return [
                        'backup',
                        'C:\\My' + core.spaceReplacement + 'Documents\\backups',
                        'D:\\My' + core.spaceReplacement +  'Documents\\backups'
                    ];
                } else {
                    return [
                        'codeFiles',
                        'null',
                        'null'
                    ];
                }

            });
        });

        afterEach( function() {
            transformStub.restore();
            namedParamsStub.restore();
        });

        it( 'for a normal set of arguments, should return an array of argument values based on spaces', function() {
            var result = core.generateArgumentsArray( 'backup C:\\filePath', function() {} );
            expect( transformStub.callCount ).to.equal( 1 );
            expect( result instanceof Array ).to.be.true;
            expect( result.length ).to.equal( 2 );
            expect( result[ 0 ] ).to.equal( 'backup' );
        });

        it( 'expect spaces in quoted argument values to be preserved but not affect length of arguments', function() {
            var result = core.generateArgumentsArray( 'backup "C:\\My Documents\\backups" "D:\\My Documents\\backups"', function() {} );
            expect( transformStub.callCount ).to.equal( 1 );
            expect( namedParamsStub.callCount ).to.equal( 0 );
            expect( result instanceof Array ).to.be.true;
            expect( result.length ).to.equal( 3 );
            expect( result[ 1 ] ).to.equal( 'C:\\My Documents\\backups' );
        });

        it( 'for a named set of arguments, expect parseNamedArguments() to be called', function() {
            var result = core.generateArgumentsArray( '[alias:backup originalPath:"C:\\My Documents\\backups" newPath:"D:\\My Documents\\backups"]', function() {} );
            expect( transformStub.callCount ).to.equal( 1 );
            expect( namedParamsStub.callCount ).to.equal( 1 );
            expect( result instanceof Array ).to.be.true;
            expect( result.length ).to.equal( 3 );
            expect( result[ 2 ] ).to.equal( 'D:\\My Documents\\backups' );
        });

        it( 'should convert any "null" argument value to true null', function() {
            var result = core.generateArgumentsArray( 'backup null', function() {} );
            expect( result.length ).to.equal( 2 );
            expect( result[ 1 ] ).to.equal( null );

            var resultB = core.generateArgumentsArray( '[alias:codeFiles originalPath:null newPath:null]', function() {} );
            expect( resultB.length ).to.equal( 3 );
            expect( resultB[ 1 ] ).to.equal( null );
        });

    });

    describe( 'renderSignature', function() {
        it( 'should return command name and comma-separated arguments if arguments present', function() {
            introspect.returns( [ 'arg1', 'arg2' ] );
            var result = core.renderSignature( 'doThisCmd', function() {} );
            expect( result ).to.equal( 'doThisCmd( arg1, arg2 )' );
        });

        it( 'should return command name and empty parentheses if no arguments present', function() {
            introspect.returns( [] );
            var result = core.renderSignature( 'doThatCmd', function() {} );
            expect( result ).to.equal( 'doThatCmd()' );
        });
    });

    describe( 'createTerminalExecutionPrefix', function() {
        var platformStub,
            throwErrorStub;

        beforeEach( function() {
            throwErrorStub = sinon.stub( output, "throwError", function( msg ) { throw new Error( msg ) } );
        });

        afterEach( function() {
            platformStub.restore();
            throwErrorStub.restore();
        });

        describe( 'when os.platform() returns "win32"', function() {
            it( 'will return a statement starting with "start" and the title', function() {
                platformStub = sinon.stub( os, 'platform', function() { return 'win32'; } );
                var result =  core.createTerminalExecutionPrefix( 'C:\\filePath', 'windowTitle' );
                expect( result ).to.match( /^start "windowTitle"/ );
            });

            it( 'will denote a drive letter switch if the path includes a drive letter', function() {
                platformStub = sinon.stub( os, 'platform', function() { return 'win32'; } );
                var result =  core.createTerminalExecutionPrefix( 'C:\\filePath', 'windowTitle' );
                expect( result ).to.equal( 'start "windowTitle" cmd /k "C: & cd \\filePath' );
            });

            it( 'will leave out the if the path does not includes a drive letter', function() {
                platformStub = sinon.stub( os, 'platform', function() { return 'win32'; } );
                var result =  core.createTerminalExecutionPrefix( '\\networkPath', 'windowTitle' );
                expect( result ).to.equal( 'start "windowTitle" cmd /k "cd \\networkPath' );
            });

        });

        describe( 'when os.platform() does not return "win32"', function() {
           it( 'will throw an error', function() {
               platformStub = sinon.stub( os, 'platform', function() { return 'darwin'; } );
               expect( function() { core.createTerminalExecutionPrefix( 'C:\\filePath', 'windowTitle' ) } ).to.throw( Error, /Currently only executes on Windows operating systems./ );
               expect( throwErrorStub.callCount ).to.equal(1);
           });
        });

    });

    describe( 'getCmdObject and setCmdObject', function() {
        it( 'should act as a direct getter/setter pair', function() {
            var originalCmd = core.getCmdObject();
            expect( originalCmd ).to.deep.equal( {} );

            core.setCmdObject( { createAlias: { signature: 'createAlias( alias, filepath )' } } );
            var updatedCmd = core.getCmdObject();

            expect( updatedCmd ).to.have.property( 'createAlias' );
            expect( updatedCmd.createAlias ).to.have.property( 'signature' );
            expect( updatedCmd.createAlias.signature ).to.equal( 'createAlias( alias, filepath )' );
        })
    });

    describe( 'getReadlineInterface and setReadlineInterface', function() {
        it( 'should act as a direct getter/setter pair', function() {
            var originalRLI = core.getReadlineInterface();
            expect( originalRLI ).to.deep.equal( {} );

            core.setReadlineInterface( { input: 'stdin', output: 'stdout' } );
            var updatedRLI = core.getReadlineInterface();

            expect( updatedRLI ).to.have.property( 'input' );
            expect( updatedRLI ).to.have.property( 'output' );
            expect( updatedRLI.input ).to.equal( 'stdin' );
            expect( updatedRLI.output ).to.equal( 'stdout' );
        })
    });
});