# ncline
ncline is a Node-powered command line interface platform that allows you to write and execute JavaScript functions that perform operational tasks on your computer.

## What does that mean?
ncline acts like a wrapper on top of your operating system terminal shell.  When you run ncline, you get a command prompt which acts like a terminal prompt, but
the commands that you enter trigger Node-powered JavaScript functions defined in ncline that perform the desired action.  ncline comes with a number of core and public 
functions you can use right away, but the project is structured in a modular fashion that lets you create your own functions (completely isolated functions or functions 
that piggyback off of existing ncline functions).

### For example:
One of the core command modules is the "filePath" module, which lets you create aliases for directories you use frequently.  So if you type in the following 
command in ncline:

**_createAlias np C:\Projects\JavaScript\Node_**

..."np" is now an alias to that directory, and now you can issue commands that utilize that alias name instead of the full path:

**_term np_** - will open a terminal window with C:\Projects\JavaScript\Node as the current directory.

**_window np_** - will open up a file explorer window to that directory.

**_grunt np {taskname}_** - will execute the Grunt task specified from the Gruntfile of that directory.

## Current project status:
Very early: so early that this README file is little more than a documentation placeholder.

The current core and public functions will run on Windows machines but have not yet been extended to work on Macintosh or Linux systems, 
and that will probably not happen until unit tests are written and committed.

## Installation requirements / process:

You need Node 0.10.21 or higher installed on your machine (and again, right now only a Windows user is going to gain any true benefit from using ncline 
at the moment).

Once Node is installed, simply download the project, unzip it, open a terminal window to the directory where you unzipped the files, and run "npm install" 
to download and install the Node modules used by ncline.

After that, type "node ncline.js" and hit Enter to start ncline.  Hitting Control-C will exit ncline.

To see a list of available commands, type "showCmds" at the command prompt and hit Enter.  Currently there is little or no documentation about what 
each command does, but they are all defined as JavaScript functions within the files and folders in the "cmdModules" folder, and many of those functions 
are easy to understand.








