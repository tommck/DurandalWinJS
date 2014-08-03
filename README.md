# Writing WinJS apps with DurandalJS - Part 1#

## Tools Used ##
* Visual Studio 2013
* Windows 8.1

## Project Setup ##
We're going to set up the Durandal.StarterKit NuGet package to run on WinJS.  Since the NuGet package pulls in some non-JavaScript code, it will not install on WinJS, so we'll install it in a temporary Web app and pull over the important pieces, So:

* First, create a Blank WinJS app "Blank App (Windows)". Call it "DurandalWinJS".![](http://i.imgur.com/Bh7J6WO.png) 
* Next, add a blank ASP.NET app called "DurandalWeb" to the same Solution.![](http://i.imgur.com/x6Ud57C.png)
_Choose the "Blank" template and deselect any optional features, since this is a temporary project_
* Now, we'll add the Durandal Starter Kit to the **Web** project.
	* Go to the NuGet Package Manager Console (Tools -> NuGet Package Manager -> Package Manager Console).
	* From there, make sure the "Default Project" is set to "DurandalWeb" and type ``Install-Package Durandal.StarterKit``  ![](http://i.imgur.com/VE7Eax4.png)
	
After the package manager has installed the Starter Kit and all it's dependencies, we need to drag the "App" folder from the Web project to the WinJS project (just drop it on the project name, which places it in the root)
Now, we need to install all the non-ASP.NET Package Dependencies for the Starter Kit.  These are: Boostrap, FontAwesome, Durandal and Durandal.Transitions. So, run the following commands in the Package Manager Console (Don't forget to set the default package to "DurandalWinJS")
* ``Install-Package bootstrap``
* ``Install-Package FontAwesome``
* ``Install-Package Durandal``
* ``Install-Package Durandal.Transitions``
Additionally, we need to update jQuery because jQuery 1.9 is not supported in WinJS, so do ``Update-Package jQUery`` in order to upgrade to 2.x

Now, we don't need the Web project anymore, so remove the "DurandalWeb" project from your solution.  The solution should look like this now:![](http://i.imgur.com/dRup67b.png)

## Code Changes ##
At this point, the project should actually build, but it won't magically work yet.  We need to change a few things (well, more than a few).

### Moving Default.js ###
I tend to leave the "Scripts", "fonts" and "css" folders where they are, since they were created by NuGet packages.  It will just cause headaches later to move this code, but I do want to move one file.

By Default, WinJS apps launch from the default.html file found in the root of the project.
It calls WinJS-specific app logic in a "/js/default.js" file from this html file.

Since I prefer to put all my application-related JavaScript code in the "App" folder, I like to move the "/js/default.js" file into the "App" folder.  So, go to the default.html and change the script tag in the default.html file. 
![](http://i.imgur.com/6qkLZLB.png)

### Script and CSS tags ###
While there are cleaner ways to inject Durandal dependencies into your code, I am just going to go with the default and insert the css and scripts directly into the default.html file. 
While we're there, we'll add the "applicationHost" div element required by Durandal

	<!DOCTYPE html>
	<html>
	<head>
	    <meta charset="utf-8" />
	    <title>DurandalWinJS</title>
	
	    <!-- WinJS references -->
	    <link href="//Microsoft.WinJS.2.0/css/ui-dark.css" rel="stylesheet" />
	    <script src="//Microsoft.WinJS.2.0/js/base.js"></script>
	    <script src="//Microsoft.WinJS.2.0/js/ui.js"></script>
	
	    <!-- DurandalWinJS references -->
	    <link href="/css/default.css" rel="stylesheet" />
	    
	    <!-- Durandal Dependencies -->
	    <link href="Content/bootstrap.css" rel="stylesheet" />
	    <link href="Content/durandal.css" rel="stylesheet" />
	    <link href="Content/font-awesome.css" rel="stylesheet" />
	
	    <script src="Scripts/jquery-2.1.1.js"></script>
	    <script src="Scripts/bootstrap.js"></script>
	    <script src="Scripts/knockout-3.1.0.js"></script>
	    <script src="Scripts/require.js"></script>
	
	    <!-- WinJS App -->
	    <script src="/app/default.js"></script>
	</head>
	<body>
	    <div id="applicationHost"></div>
	</body>
	</html>
 
Make sure your default.html looks like the one above.

### RequireJS ###
Since WinJS apps need to be launched using the code that's in the default.js file, we can't use the traditional way to launch Durandal with the ``data-main="/App/main"``.  Instead, we'll have to do it a bit more manually.

#### Configuration ####
To make this easier, we'll open up the main.js and extract the RequireJS configuration at the top of the file into its own file called require.config.js. The code looks like this in main.js:

	requirejs.config({
	    paths: {
	        'text': '../Scripts/text',
	        'durandal': '../Scripts/durandal',
	        'plugins': '../Scripts/durandal/plugins',
	        'transitions': '../Scripts/durandal/transitions'
	    }
	});

In order to extract it into a separate file, the object literal passed into the requirejs.config function needs to be assigned to the global ``require`` variable. So, the new file will ``require = [object literal copied from above]``.  In addition, we need to set the base URL of the application to point to the "/App" folder, so we'll add the "baseUrl" setting as well.  The final version of require.config.js looks like this:
  
	require = {
	    baseUrl: "/App",
	    paths: {
	        'text': '../Scripts/text',
	        'durandal': '../Scripts/durandal',
	        'plugins': '../Scripts/durandal/plugins',
	        'transitions': '../Scripts/durandal/transitions'
	    }
	};

This file needs to be added in the default.html above the inclusion of require.js, since it needs to be set before require.js is loaded.  So go add the following line:

    <script src="App/require.config.js"></script>

#### Startup ####
Now, all we need to do is wire up RequireJS to load our Durandal app.

If you look in the default.js file, you will see a block of code that looks like this:

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };
Notice the line that says ``args.setPromise(WinJS.UI.processAll());``.  This is what processes WinJS UI binding and basically kick starts the whole app.  We need to leave this in there, but add something else onto the end, so we'll add a ``.then()`` call to the ``processAll()`` method's promise

> WARNING: If you are not intimately familiar with the concept of Promises in JavaScript, you should familiarize yourself with it.  Almost everything in WinJS/WinRT is asynchronous, which means Promises in JavaScript.

OK, so if we replace that line with the following lines, it should do it:

    args.setPromise(
        WinJS.UI.processAll()
        .then(function() {
            require(['main']);
        }));

This call just explicitly requires the "main" module, just like the ``data-main="/App/main"`` attribute does in a typical Durandal setup.

# It Works! (Sort Of)#
OK, this app will actually run and show you what you're expecting.  A full, running Durandal Project. If you run it in the Simulator, it looks like this:
![](http://i.imgur.com/HzPNKRS.png)

## Problems ##

### Flickr ###
Unfortunately, the Flickr tab will not work ever. You will see errors like:

    APPHOST9601: Can’t load <http://api.flickr.com/...
	An app can’t load remote web content in the local context.

This is a security issue. Remote content cannot be loaded and displayed in a WinJS application. This is a security limitation. If the application has permissions, it can download the content, then display it, but it can't pull it from the server directly.

### Templates ###
Simple data binding works fine, but templates present a problem.  Dynamically creating HTML and injecting it into an application is a potential security hole. Since we need to be able to do this occasionally, Microsoft provided a method to tell the runtime that it's OK.  This method is called ``MSApp.execUnsafeLocalFunction()``

First, we'll make it fail

#### Making it Fail ####
We'll replace the Flickr view with another dummy view with simple data binding. So, we'll rename flickr.* to dummy.* and simplify it.  Here are the contents of the files now:

Dummy.js:

	define([], function () {
	    return {
	        buyer: { name: 'Tom', credits: 250 },
	        seller: { name: 'Rob', credits: 5800 }
	    };
	});
Dummy.html:
	
	<script type="text/html" id="person-template">
	    <h3 data-bind="text: name"></h3>
	    <p>Credits: <span data-bind="text: credits"></span></p>
	</script>
	
	<section>
	    <div margin="200px">
	        <h2>Participants</h2>
	        Here are the participants:
	        <div data-bind="template: { name: 'person-template', data: buyer }"></div>
	        <div data-bind="template: { name: 'person-template', data: seller }"></div>
	
	    </div>
	</section>
Remember to change the routing map in shell.js to this:

    { route: 'dummy', moduleId: 'viewmodels/dummy', nav: true }

Now, if you try to run this, the app will die with an error like the following:

	HTML1701: Unable to add dynamic content '<script type="text/html" id="person-template">
	    <h3 data-bind="text: name"></h3>
	    <p>Credits: <span data-bind="text: credits"></span></p>
	</script>
	<section>
	    <div margin="200px">
	        <h2>Participants</h2>
	        Here are the participants:
	        <div data-bind="template: { name: 'person-template', data: buyer }"></div>
	        <div data-bind="template: { name: 'person-template', data: seller }"></div>
	    </div>
	</section>'. A script attempted to inject dynamic content, or elements previously modified dynamically, that might be unsafe. For example, using the innerHTML property to add script or malformed HTML will generate this exception. Use the toStaticHTML method to filter dynamic content, or explicitly create elements and attributes with a method such as createElement.  For more information, see http://go.microsoft.com/fwlink/?LinkID=247104.

You can see that it's trying to render things, but it fails because the WinJS runtime does not allow arbitrary HTML injection.

#### Making it Work ####
In Durandal, the code that parses the HTML for injection into Durandal is in the ``viewEngine`` object. Rob Eisenberg was kind enough to expose the ``parseMarkup`` method so that Durandal can support WinJS. 

So, we need to add the following code somewhere:

    var parser = viewEngine.parseMarkup;
    viewEngine.parseMarkup = function (markup) {
        // wrap existing parser in an "unsafe" call to avoid exceptions with dynamic html injection
        return MSApp.execUnsafeLocalFunction(function () {
            return parser(markup);
        });
    };
Since this should happen at startup, it should most likely go into a durandal plugin, so we'll make it a module and put in in a "startup" folder.  Here are the contents of startup/htmlParsing.js:

	define(['durandal/viewEngine'], function (viewEngine) {
	    "use strict";
	    return {
	        install: function() {
	            var parser = viewEngine.parseMarkup;
	            viewEngine.parseMarkup = function(markup) {
	                // wrap existing parser in an "unsafe" call
	                return MSApp.execUnsafeLocalFunction(function() {
	                    return parser(markup);
	                });
	            };
	        }
	    };
	});
Now, in order to run this plugin, we need to configure the plugin. This means adding a second call to ``app.configurePlugins`` that points to our "startup" folder:

    app.configurePlugins({
        htmlParsing: true
    }, "startup");
Now, it will load our new plugin.  Let's test it!
![](http://i.imgur.com/TyNm1ty.png)

## Where to go from here ##
One thing you'll quickly realize is that you'll want to take advantage of the built in controls in WinJS.  They will give you all the fancy stuff, like touch integration, including scrolling with acceleration and other whiz bang stuff.

Look for my followup articles on handling things like Extended Splash Screen, Integrating Knockout bindings into WinJS controls and working with AppBars and the Back Button.