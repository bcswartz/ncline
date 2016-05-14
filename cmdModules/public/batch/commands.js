//Load needed core Node modules
var fs = require( 'fs' );
var os = require( 'os' );
var childProcess = require( 'child_process' );

//Load needed library files
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Load init module used to create/load existing configuration and usage data
var init = require( './init' );

init.execute();

var data = init.getData();
var dataFile = init.getConfig().dataFile;

var parseBatchFileStatement = function( batchPath, alias ) {
    var driveLetter, cdPath, pathArray, pathString, batchFilename;

    pathArray = batchPath.split( '\\' );
    batchFilename = pathArray[ pathArray.length - 1 ];
    pathString = pathArray.slice( 0, -1 ).join( '\\' );

    driveLetter = batchPath.match(/\S{1}\:/);
    if( driveLetter != undefined ) {
        cdPath = pathString.replace(/\S{1}\:/, '');
        return 'start "' + alias + '" cmd /k "' + driveLetter + ' & cd ' + cdPath + ' & ' + batchFilename + '"';
    } else {
        return 'start "' + alias + '" cmd /k "' + pathString + ' & ' + batchFilename + '"';
    }

}

if( os.platform() == 'win32' ) {
    module.exports = {

        commands: {
            setBatchAliasVerbose: function ( setting ) {
                if ( setting == null || !core.isBoolean( setting ) ) {
                    output.throwError( "You must provide a string representing a Boolean value (true/false, yes/no, or y/n)" );
                }

                data.verbose = core.booleanValue( setting );

                fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                    output.passError( err );
                } );
            },

            createBatchAlias: function ( alias, pathToBatchFile ) {
                if ( alias == null || pathToBatchFile == null ) {
                    output.throwError( "The batch file alias and batch file parameters must be defined." );
                } else if ( data.aliases.hasOwnProperty( alias ) ) {
                    output.throwError( "Alias '" + alias + "' already exists; use updateBatchAlias or deleteBatchAlias to change." );
                }

                data.aliases[ alias ] = pathToBatchFile;

                fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                    output.passError( err );
                    if ( !err && core.booleanValue( data.verbose ) ) {
                        output.success( "Batch file alias '" + alias + "' set to '" + pathToBatchFile + "'." );
                    }
                } );
            },
            
            renameBatchAlias: function( currentAlias, newAlias ) {
                if( currentAlias == null || newAlias == null ) {
                    output.throwError( "The current and new alias names must be defined." );
                } else if ( !data.aliases.hasOwnProperty( currentAlias ) ) {
                    output.throwError( "Alias '" + currentAlias + "' not found; use createBatchAlias to create." );
                }

                data.aliases[ newAlias ] = data.aliases[ currentAlias ];
                delete data.aliases[ currentAlias ];

                fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                    output.passError( err );
                    if ( !err && core.booleanValue( data.verbose ) ) {
                        output.success( "Batch file alias '" + currentAlias + "' renamed to '" + newAlias + "'." );
                    }
                } );
                
                
            },

            updateBatchAlias: function ( alias, pathToBatchFile ) {
                if ( alias == null || pathToBatchFile == null ) {
                    output.throwError( "The batch file alias and filepath parameters must be defined." );
                } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                    output.throwError( "Batch file alias '" + alias + "' not found; use createBatchAlias to create." );
                }

                data.aliases[ alias ] = pathToBatchFile;

                fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                    output.passError( err );
                    if ( !err && core.booleanValue( data.verbose ) ) {
                        output.success( "Batch file alias '" + alias + "' updated to '" + pathToBatchFile + "'." );
                    }
                } );
            },

            deleteBatchAlias: function ( alias ) {
                if ( alias == null ) {
                    output.throwError( "The batch file alias parameter must be defined." );
                } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                    output.throwError( "Batch file alias '" + alias + "' not found." );
                }

                delete data.aliases[ alias ];
                fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function ( err ) {
                    output.passError( err );
                    if ( !err && core.booleanValue( data.verbose ) ) {
                        output.success( "Batch file alias '" + alias + "' deleted." );
                    }
                } );
            },

            //TODO: Consider output as part of shared output list function
            showBatches: function () {
                var sortedAliases = core.sortObjectProperties( data.aliases );
                console.log( "Current batch file aliases:".underline.magenta );
                for ( var a in sortedAliases ) {
                    if ( sortedAliases[ a ] instanceof Array ) {
                        console.log( ( a + ':' ).cyan );
                        sortedAliases[ a ].forEach( function ( path ) {
                            console.log( ('   ' + path ).cyan );
                        } )
                        console.log( '' );
                    } else {
                        console.log( ( a + ': ' + sortedAliases[ a ] ).cyan );
                    }
                }
                output.prompt();
            },

            batch: function ( alias ) {
                if ( alias == null ) {
                    output.throwError( "The batch file alias parameter must be defined." );
                } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                    output.throwError( "Batch file alias '" + alias + "' not found." );
                }

                childProcess.exec( parseBatchFileStatement( data.aliases[ alias ], alias ), function ( err ) {
                    output.passError( err );
                } );
            }
        }
    }

}

