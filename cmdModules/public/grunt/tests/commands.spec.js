var expect = require( 'chai' ).expect;
var sinon = require( 'sinon' );
var proxyquire = require( 'proxyquire' );

describe( 'grunt commands', function() {
    var childProcess,
        output,
        core,
        fp,
        commands;

    before( function() {
        //Set stubs
        childProcess = sinon.stub();
        output = sinon.stub();
        core = sinon.stub();
        fp = sinon.stub();

        commands = proxyquire( '../commands', {
            'child_process': childProcess,
            '../../../lib/output': output,
            '../../../lib/core': core,
            '../../core/filePath/commands': fp
        } ).commands;

    });

    var throwErrorStub,
        targetPathStub,
        getAliasStub,
        passErrorStub,
        prefixStub,
        execStub;

    beforeEach( function() {
        throwErrorStub = sinon.stub( output, "throwError", function( msg ) { throw new Error( msg ) } );
        targetPathStub = sinon.stub( fp.hooks, 'getTargetPath', function() { return 'C:\\targetPath' } );
        getAliasStub = sinon.stub( fp.hooks, 'getAlias', function( aliasName ) {
            if( aliasName == 'aliasSet' ) {
                return [ 'C:\\pathOne', 'C:\\pathTwo' ]
            } else {
                return 'C:\\' + aliasName
            }
        });
        passErrorStub = sinon.stub( output, 'passError' );
        prefixStub = sinon.stub( core, 'createTerminalExecutionPrefix', function( filepath, termAlias ) { return 'start "' + termAlias + '" cmd /k "' + filepath } );
        execStub = sinon.stub( childProcess, 'exec', function( statement, callback ) { callback(); } )
    });

    afterEach( function() {
        throwErrorStub.restore();
        targetPathStub.restore();
        getAliasStub.restore();
        passErrorStub.restore();
        prefixStub.restore();
        execStub.restore();
    });

    describe( 'grunt', function() {
        describe( 'under failure conditions', function() {
            it( 'will throw an error if no arguments are passed', function() {
                expect( function() { commands.grunt() } ).to.throw( Error, /This function requires at least one argument/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( prefixStub.callCount ).to.equal( 0 );
            });

            it( 'will throw an error if more than two arguments are passed', function() {
                expect( function() { commands.grunt( 'testAlias', 'testGruntTask', '"--filename:dark.txt"' ) } ).to.throw( Error, /This function takes only two arguments/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( prefixStub.callCount ).to.equal( 0 );
            });
            it( 'will throw an error if an alias set is used as the alias', function() {
                expect( function() { commands.grunt( 'aliasSet', 'testGruntTask' ) } ).to.throw( Error, /The specified alias is an alias set./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( prefixStub.callCount ).to.equal( 0 );
            });
        });

        describe( 'under success conditions', function() {

            it( 'will generate a Grunt statement using the target path if no alias specified', function() {
                commands.grunt( 'localGruntTask' );
                expect( targetPathStub.callCount ).to.equal( 1 );
                expect( getAliasStub.callCount ).to.equal( 0 );
                expect( prefixStub.callCount ).to.equal( 1 );
                expect( execStub.callCount ).to.equal( 1 );
                expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "localGruntTask" cmd /k "C:\\targetPath & grunt localGruntTask"' );
            });

            it( 'will generate a Grunt statement using the alias path if an alias specified', function() {
                commands.grunt( 'gruntTaskFolder', 'otherGruntTask' );
                expect( getAliasStub.callCount ).to.equal( 1 );
                expect( targetPathStub.callCount ).to.equal( 0 );
                expect( prefixStub.callCount ).to.equal( 1 );
                expect( execStub.callCount ).to.equal( 1 );
                expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "otherGruntTask" cmd /k "C:\\gruntTaskFolder & grunt otherGruntTask"' );

            });
        });

    });

    describe( 'gruntWithOptions', function() {
        describe( 'under failure conditions', function() {
            it( 'will throw an error if 0 or 1 argument(s) are passed', function() {
                expect( function() { commands.gruntWithOptions() } ).to.throw( Error, /This function requires at least two arguments/ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( prefixStub.callCount ).to.equal( 0 );

                expect( function() { commands.gruntWithOptions( 'gruntTaskName') } ).to.throw( Error, /This function requires at least two arguments/ );
                expect( throwErrorStub.callCount ).to.equal( 2 );
                expect( prefixStub.callCount ).to.equal( 0 );
            });

            it( 'will throw an error if an alias set is used as the alias', function() {
                expect( function() { commands.gruntWithOptions( 'aliasSet', 'otherGruntTask', '--name:main.js' ) } ).to.throw( Error, /The specified alias is an alias set./ );
                expect( throwErrorStub.callCount ).to.equal( 1 );
                expect( prefixStub.callCount ).to.equal( 0 );
            });

        });

        describe( 'under success conditions', function() {

            it( 'will generate a Grunt statement including options using the target path if no alias specified', function() {
                commands.gruntWithOptions( 'localGruntTask', '--name:main.js' );
                expect( targetPathStub.callCount ).to.equal( 1 );
                expect( getAliasStub.callCount ).to.equal( 0 );
                expect( prefixStub.callCount ).to.equal( 1 );

                expect( execStub.callCount ).to.equal( 1 );
                expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "localGruntTask" cmd /k "C:\\targetPath & grunt localGruntTask --name:main.js"' );
            });

            it( 'will generate a Grunt statement including options using the alias path if an alias specified', function() {
                commands.gruntWithOptions( 'gruntTaskFolder', 'otherGruntTask', '--name:main.js' );
                expect( getAliasStub.callCount ).to.equal( 1 );
                expect( targetPathStub.callCount ).to.equal( 0 );
                expect( prefixStub.callCount ).to.equal( 1 );

                expect( execStub.callCount ).to.equal( 1 );
                expect( execStub.args[ 0 ][ 0 ] ).to.equal( 'start "otherGruntTask" cmd /k "C:\\gruntTaskFolder & grunt otherGruntTask --name:main.js"' );
            });
        });

    });

});