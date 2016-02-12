# ncline
ncline ("**N**ode **c**ommand **line**") is a platform for writing Node-powered JavaScript functions ("commands") that can be executed from a command-line interface.

Anyone can download ncline and use the commands included in the ncline library of commands to configure and perform operational tasks on their computers.
JavaScript developers can go a step further and create their own commands, and either use their commands privately or add them to the ncline library to be used by
other ncline users.

### Usage example
Say you have a deep filepath that you frequently open, like C:\Users\Me\Documents\projects\current.  You can create a "current" alias for that filepath in ncline
by typing the following command:

**_createAlias current C:\Users\Me\Documents\projects\current_**

...and ncline will store that alias entry.  Then anytime you need to open a window to that filepath, in ncline you simply type:

**_window current_**

...and a window displaying that filepath's contents will open.

## Current platform status
The current library of commands in ncline includes commands that will run on Windows and Macintosh computers:  none have been coded to work on Linux as yet.

## Installation requirements / process:
You need Node 0.10.21 (https://nodejs.org/) or higher installed on your Windows or Macintosh computer.

Once Node is installed, simply download the project, unzip it, open a terminal window to the directory where you unzipped the files, and run "npm install" 
to download and install the Node modules used by ncline.

After that, type "node ncline.js" and hit Enter to run ncline. Hit Enter again when prompted, and you will see a command prompt denoting the alias name for 
the current target filepath (opening and interacting with filepaths using aliases/nicknames is part of the base ncline functionality).

## How to use ncline
To execute a command, you simply type in the command name followed by any command arguments in the expected order, separated by spaces, then hit Enter.  

If you don't want to provide a value for an optional argument, set the value to "null" (with or without double-quotes). If any argument value contains 
spaces, enclose the argument value in double-quotes:

**_createAliasSet docs "C:\My Documents"_**

You can also provide the arguments as name:value pairs enclosed in square or curly brackets.  It involves more typing but it can be the better option if you
want to skip a number of optional arguments or you want to reorder them:

**_updateAliasSet [action:add alias:docs filePath:"D:\\My Documents"]_**

Any status or error feedback provided by the invoked command will appear in the terminal window before the next command prompt.

Hitting the Tab key at the command prompt will list the commands by name, and will also auto-suggest commands if you type a partial command name. Hitting 
the up arrow key will pull up previous commands executed during the current ncline session.

To view a list of commands that include their arguments, type the command "showCmds" and hit Enter. To view manual documentation for a specific command, type "man" and then 
the command name, and hit Enter.

To exit ncline, hit Control-C. You may need to hit it twice if windows created by ncline are still open.

You have the option of customizing the command names if you don't like one or more of the current names; see the "Overriding command names" section for details.

You can re-read many of these hints in ncline by typing the "about" command.

### Current command library functionality (February 2016)

Currently the ncline command library includes commands for:

* Adding, changing, and deleting aliases for individual or multiple filepaths, and for setting the current target and source filepaths for filepath-related functions.

* Opening one or more file explorer windows based on the provided alias name.

* Opening one or more terminal windows based on the provided alias name.

* Executing a Grunt command in the filepath represented by the provided alias name.

* Creating or opening a .txt file in Notepad based on the provided alias name (Windows only).

* Adding, changing, and deleting aliases for Windows batch files (Windows only).

* Executing the Windows batch file associated with the specified batch alias name (Windows only). 

* Adding, changing, and deleting aliases for opening websites from ncline in the specified browser (useful for opening multiples sites in one browser or the same site in different browsers quickly).

## Creating new ncline commands

As stated earlier, ncline is a platform for writing Node-powered JavaScript functions designed to be executed from a command line interface. It is designed to 
make it easy for developers to add their own command functions and potentially share those functions without worrying about breaking existing 
functionality or inadvertently sharing private information about their system.

### Writing a simple command by example

1. Navigate to the folder where you installed ncline. In the _cmdModules/private_ directory, create a new directory called "math".  This is your command module folder.  

2. In the new "math" folder, create a file called "commands.js".  This is the file containing all commands for the "math" module.  

3. In commands.js, add the following code:

        ```
        module.exports = {
            commands: {
                add: function( arg1, arg2 ) {
                    console.log( arg1 + arg2 );
                }
            }
        }
        ```

4. Save the file, then start ncline ("node ncline.js").  Type "add 1 2" and hit Enter.  If the command executes properly, the console.log statement in the command 
will output "12" in the console interface.  Why "12" and not "3"? **Because in ncline all arguments input from the command line are provided to the function 
as Strings** (with the exception of "null", which is automatically translated to null by ncline).  So if your arguments need to be something else (a number, an array, etc.), 
your command function will need to translate them.
5. Quit ncline (Control/Command-C), and refactor your command to convert the arguments to strings:  

        ```
        module.exports = {
            commands: {
                add: function( arg1, arg2 ) {
                    var int1 = parseInt( arg1 );
                    var int2 = parseInt( arg2 );
                    console.log( int1 + int2 );
                }
            }
        }
        ```

6. Now if you run ncline and execute "add 1 2", the output will be "3".  Great.  But what if your user leaves out one of the arguments: try executing "add 1". Now
the result is "NaN". **Because commands in ncline are executed directly by end users, they need to gracefully handle unexpected input**.
7. Quit ncline and refactor your command to examine the argument length and handle missing arguments by reporting an error:  

        ```
        var output = require( '../../../lib/output' );  
        module.exports = {  
            commands: {
                add: function( arg1, arg2 ) {  
                    if( arguments.length != 2 ) {  
                        output.throwError( "You must provide two integers" );  
                    }  
                    var int1 = parseInt( arg1 );  
                    var int2 = parseInt( arg2 );  
                    console.log( int1 + int2 );  
                } 
            }
        }
        ```

8. Now the function makes use of the throwError method of the _lib/output.js_ module to display an error message in the console interface.  So if you run ncline and 
execute "add 1", you will see the text "ERROR: You must provide two integers" displayed in red in the console interface.  The function could still use a check to see
if both arguments can be converted to integers, but that's an exercise left to the reader.
  
### How ncline bootstraps via file and directory-based conventions
As illustrated in the example, each set of command functions lives in a module folder within one of the four main subfolders of _cmdModules_:

* core  
    * Home of commands considered to be "core" to ncline functionality, commands and command data designed to be used by other commands.
* public  
    * Contains commands designed to be shared with other ncline users.
* private  
    * Commands either written specifically for use only on your personal system or commands not yet ready to be moved to "public" or "core". Entire folder and all 
subfolders are Git-ignored, so no modules in here are ever committed.
* demo  
    * Same as "private" except commands in here are left out of ncline command collection unless ncline is run in demo mode("node ncline.js demo:true").

Parallel to the _cmdModules_ folder is the _cmdData_ folder.  This folder serves as the storage space for any JSON-based data generated and utilized by 
command functions, and the folder and all of its subfolders are Git-ignored, ensuring that any data generated by ncline commands (such as the names of filepaths on 
your machine) are never committed.  It also serves as the home for the "nameOverrides.json" file (see the next section).

The final folder is the _lib_ folder which contains utility functions not meant to be exposed as user-invoked commands, but can be used within command functions. 
The example made use of the output.js library module to display error messages to the user.

When ncline loads, it walks through the command module folders.  In each folder, it loads the "commands.js" file via require(), executing any setup code in the file (such as code
 that creates or loads command module data in a _cmdData_ subfolder of the same name) and mapping all of the functions defined in the "commands" object in module.exports into a global "cmd" object, 
 along with contextual data.  It will also look for a "manual.json" file in the folder and associate the documentation data from that file with the appropriate commands in the "cmd" 
 object.
 
### Overriding command names

During the startup process, ncline keeps track of any instances where two or more commands have the same name.  As an example, say there is a "createAlias" command function 
in both the _private/localCommands_ module folder as well as the _core/filePath_ module folder.  
 
When that scenario occurs, ncline will complete its startup and report "Command 'createAlias' is defined more than once, last command defined wins."  So if the _private/localCommands_ 
function was added to the command catalog last, that is the function that will execute when "createAlias" is invoked.
 
To solve that issue - or to simply rename a function you don't like or have trouble typing - you can edit the "nameOverrides.json" file in the root of the _cmdData_ directory and
configure new names for functions, referencing the function you want to rename by module folder name and function name.  So in the example above, to rename the "createAlias"
command in _private/localCommands_, you would edit the "nameOverrides.json" file to look like this:
 
````
{
    "localCommands": {
        "createAlias": "ca"
    }  
}  
````
 
Now to invoke _private/localCommands_ "createAlias", you would type "ca" at the command prompt instead.
 
These name overrides are private and only override the "lookup" name of the function in the command catalog, so they have no impact on the functions themselves or on other 
ncline users.
 
### Command development best practices

* As alluded to earlier, remember that all arguments for your command functions come in as strings, and that you have to anticipate potential user mistakes.
* Peruse the modules in the _lib_ folder so you know what's there for you to use.  Pay particular attention to the output.js module:  use its functions to provide feedback 
 messages to the user (error messages, warnings, confirmation that the function worked).
* If your commands need to persist data, look at how the private functions and the commands in the _core/filePath/commands.js_ handle data persistence.
* If you write functions that only work on a single OS, wrap the module.exports in a conditional statement that uses Node's **os.platform()** function to determine the OS such 
 that the commands are only exported when appropriate.
* Only functions in the "commands" object of module.exports will be exposed as commands, which gives you the option of defining other functions or properties in module.exports strictly for use by 
other command module developers ("hooks"). The module.exports in _core/filePath/commands.js_ contains some examples.
* Look at the existing commands and their unit tests for guidance and ideas.

## Opportunities to contribute

If you're interested in contributing to the improvement of ncline but aren't sure where to start, here are a few ideas:

* When the Tab "autocomplete" action cannot find a command base on the currently-typed name, it displays a list of all commands in no particular order (per the commandCompleter function in 
the ncline.js file.  Alphabetizing that list would be a nice improvement.
* Creating a new function in output.js that could replace the use of "console.log" in some of the display commands.
* The addition of a "renameAlias" command to the various alias command sets (filepath, batch, browser).
* The creation of a Gulp task executor similar to the current Grunt task executor.
* The creation of a set of commands to create/open TextEdit files on a Macintosh similar to the current Notepad set of commands.
* The creation of a set of commands for aliasing and executing Macintosh shell scripts similar to the current Windows batch file set of commands.

If you do create new public (or core) command modules for inclusion in ncline, please provide unit tests and a manual.json file documenting your commands as part of your contribution.
 
