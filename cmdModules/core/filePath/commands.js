//Load needed core Node modules
var fs =  require( 'fs' );

//Load needed library files
var output = require( '../../../lib/output' );
var core = require( '../../../lib/core' );

//Load init module used to create/load existing configuration and usage data
var init = require( './init' );

init.execute();

var data = init.getData();
var dataFile = init.getConfig().dataFile;

module.exports = {


    commands: {
        setPathVerbose: function( setting ) {
            if( setting == null || !core.isBoolean( setting ) ) {
              output.throwError( "You must provide a string representing a Boolean value (true/false, yes/no, or y/n)" );
            }

            data.verbose = core.booleanValue( setting );

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
            } );
        },

        createAlias: function( alias, filepath ) {
            if( alias == null || filepath == null ) {
                output.throwError( "The alias and filepath parameters must be defined." );
            } else if ( data.aliases.hasOwnProperty( alias ) ) {
                if( data.aliases[ alias ] instanceof Array ) {
                    output.throwError( "Alias '" + alias + "' already exists as an alias set; use updateAliasSet or deleteAliasSet to change." );
                } else {
                    output.throwError( "Alias '" + alias + "' already exists; use updateAlias or deleteAlias to change." );
                }
            }

            data.aliases[ alias ] = filepath;

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Path alias '" + alias + "' set to '" + filepath + "'." );
                }
            } );
        },

        updateAlias: function( alias, filepath ) {
            if( alias == null || filepath == null ) {
                output.throwError( "The alias and filepath parameters must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found; use createAlias to create." );
            } else if ( data.aliases[ alias ] instanceof Array ) {
                output.throwError( "Alias '" + alias + "' belongs to an alias set; use updateAliasSet to modify." );
            }

            data.aliases[ alias ] = filepath;

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Path alias '" + alias + "' updated to '" + filepath + "'." );
                }
            } );
        },

        renameAlias: function( currentAlias, newAlias ) {
            if( currentAlias == null || newAlias == null ) {
                output.throwError( "The current and new alias names must be defined." );
            } else if ( !data.aliases.hasOwnProperty( currentAlias ) ) {
                output.throwError( "Alias '" + currentAlias + "' not found; use createAlias to create." );
            } else if ( data.aliases[ currentAlias ] instanceof Array ) {
                output.throwError( "Alias '" + currentAlias + "' belongs to an alias set; use renameAliasSet to modify." );
            }

            data.aliases[ newAlias ] = data.aliases[ currentAlias ];
            delete data.aliases[ currentAlias ];

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Path alias '" + currentAlias + "' renamed to '" + newAlias + "'." );
                }
            } );
        },

        deleteAlias: function( alias ) {
            if( alias == null ) {
                output.throwError( "The alias parameter must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found." );
            } else if ( data.aliases[ alias ] instanceof Array ) {
                output.throwError( "Alias '" + alias + "' belongs to an alias set; use deleteAliasSet to modify." );
            }

            delete data.aliases[ alias ];
            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Path alias '" + alias + "' deleted." );
                }
            } );
        },

        createAliasSet: function( alias, filepath ) {
            if( alias == null || filepath == null ) {
                output.throwError( "The alias and filepath parameters must be defined." );
            } else if ( data.aliases.hasOwnProperty( alias ) ) {
                if( data.aliases[ alias ] instanceof Array ) {
                    output.throwError( "Alias '" + alias + "' already exists as an alias set; use updateAliasSet or deleteAliasSet to change." );
                } else {
                    output.throwError( "Alias '" + alias + "' already exists; use updateAlias or deleteAlias to change." );
                }
            }

            data.aliases[ alias ] = [ filepath ];

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Alias set '" + alias + "' created with first path set to '" + filepath + "'." );
                }
            } );
        },

        updateAliasSet: function( alias, action, filepath, replacementFilepath ) {
            var pathIndex;

            if( alias == null || action == null || filepath == null ) {
                output.throwError( "The alias, action ('add', 'update', or 'delete') and filepath parameters must be defined." );
            } else if( action != 'add' && action != 'update' && action != 'delete' ) {
                output.throwError( "The action must be either 'add', 'update' or 'delete'." );
            } else if( action == 'update' && !replacementFilepath ) {
                output.throwError( "When using the 'update' action, you must provide 2 filepaths: the one being replaced and the replacement" );
            } else if( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias set '" + alias + "' not found; use createAliasSet to create." );
            } else if( !( data.aliases[ alias ] instanceof Array ) ) {
                output.throwError( "Alias '" + alias + "' does not match an alias set." );
            }

            switch( action ) {
                case "add":
                    data.aliases[ alias ].push( filepath );
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                        output.passError( err );
                        if( !err && core.booleanValue( data.verbose )) {
                            output.success( "Path '" + filepath + "' added to alias set '" + alias + "'." );
                        }
                    } );
                    break;

                case "update":
                    pathIndex = data.aliases[ alias ].indexOf( filepath );
                    if( pathIndex == - 1 ) {
                        output.throwError( "Path '" + filepath + "' not found in alias set '" + alias + "'.");
                    }
                    data.aliases[ alias ][ pathIndex ] = replacementFilepath;
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                        output.passError( err );
                        if( !err && core.booleanValue( data.verbose )) {
                            output.success( "Alias set '" + alias + "' path '" + filepath + "' changed to '" + replacementFilepath + "'." );
                        }
                    } );
                    break;

                case "delete":
                    pathIndex = data.aliases[ alias ].indexOf( filepath );
                    if( pathIndex == - 1 ) {
                        output.throwError( "Path '" + filepath + "' not found in alias set '" + alias + "'.");
                    }
                    data.aliases[ alias ].splice( pathIndex, 1 );
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                        output.passError( err );
                        if( !err && core.booleanValue( data.verbose )) {
                            output.success( "Path '" + filepath + "' removed from alias set '" + alias + "'." );
                        }
                    } );
                    break;
            }
        },

        renameAliasSet: function( currentAlias, newAlias ) {
            if( currentAlias == null || newAlias == null ) {
                output.throwError( "The current and new alias names must be defined." );
            } else if ( !data.aliases.hasOwnProperty( currentAlias ) ) {
                output.throwError( "Alias '" + currentAlias + "' not found; use createAliasSet to create." );
            } else if ( !( data.aliases[ currentAlias ] instanceof Array ) ) {
                output.throwError( "Alias '" + currentAlias + "' does not match an alias set; use renameAlias to modify." );
            }

            data.aliases[ newAlias ] = data.aliases[ currentAlias ];
            delete data.aliases[ currentAlias ];

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Path alias set '" + currentAlias + "' renamed to '" + newAlias + "'." );
                }
            } );
        },

        deleteAliasSet: function( alias ) {
            if( alias == null ) {
                output.throwError( "The alias parameter must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found." );
            } else if ( !( data.aliases[ alias ] instanceof Array ) ) {
                output.throwError( "Alias '" + alias + "' does not match an alias set." );
            }

            delete data.aliases[ alias ];

            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Path alias set '" + alias + "' deleted." );
                }
            } );
        },

        target: function( alias ) {
            if( alias ) {
                if( data.aliases.hasOwnProperty( alias ) ) {
                    if( data.aliases[ alias ] instanceof Array ) {
                        output.throwError( "Alias '" + alias + "' refers to an alias set; which cannot be a target." );
                    }
                    data.previousTarget = data.target;
                    data.target = {
                        alias: alias,
                        path: data.aliases[ alias ]
                    };
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                        output.passError( err );
                        if( !err && core.booleanValue( data.verbose )) {
                            output.success( "Target path set to '" + data.target.alias + "': " + data.target.path );
                        }
                    } );
                } else {
                    output.throwError( "Filepath alias '" + alias + "' not recognized; create it with 'createAlias {alias} {filepath}' ");
                }
            } else {
                output.msg( "Current target alias:path is '" + data.target.alias + "': " + data.target.path );
            }
        },


        source: function( alias ) {
            if( alias ) {
                if( data.aliases.hasOwnProperty( alias ) ) {
                    if( data.aliases[ alias ] instanceof Array ) {
                        output.throwError( "Alias '" + alias + "' refers to an alias set; which cannot be a source." );
                    }
                    data.previousSource = data.source;
                    data.source = {
                        alias: alias,
                        path: data.aliases[ alias ]
                    };
                    fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                        output.passError( err );
                        if( !err && core.booleanValue( data.verbose )) {
                            output.success( "Source path set to '" + data.source.alias + "': " + data.source.path );
                        }
                    } );

                } else {
                    output.throwError( "Filepath alias '" + alias + "' not recognized; create it with 'createAlias {alias} {filepath}' ");
                }
            } else {
                if( data.source.alias != undefined ) {
                    output.msg( "Current source alias:path is '" + data.source.alias + "': " + data.source.path );
                } else {
                    output.msg( "Currently no source alias/path is defined." );
                }

            }
        },

        clearSource: function() {
            data.previousSource = data.source;
            data.source = {};
            fs.writeFile( dataFile, JSON.stringify( data, null, 2 ), function( err ) {
                output.passError( err );
                if( !err && core.booleanValue( data.verbose )) {
                    output.success( "Source cleared." );
                }
            } );
        },

        //TODO: Consider output as part of shared output list function
        showPaths: function() {
            var sortedAliases = core.sortObjectProperties( data.aliases );
            console.log( "Current filepath aliases:".underline.magenta );
            for( var a in sortedAliases ) {
                if( sortedAliases[ a ] instanceof Array ) {
                    console.log( ( a + ':' ).cyan );
                    sortedAliases[ a ].forEach( function( path ) {
                        console.log( ('   ' + path ).cyan );
                    })
                    console.log('');
                } else {
                    console.log( ( a + ': ' + sortedAliases[ a ] ).cyan );
                }
            }
            output.prompt();
        }

    },

    hooks: {
        getAlias: function( alias ) {
            if( alias == null ) {
                output.throwError( "The alias parameter must be defined." );
            } else if ( !data.aliases.hasOwnProperty( alias ) ) {
                output.throwError( "Alias '" + alias + "' not found." );
            }

            return data.aliases[ alias ];
        },

        getTargetAlias: function() {
            return data.target.alias
        },

        getSourceAlias: function() {
            return data.source.alias
        },

        getTargetPath: function() {
            return data.target.path
        },

        getSourcePath: function() {
            return data.source.path
        }
    }
}

