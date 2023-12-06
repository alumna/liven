<div align="center">
	<img src="https://github.com/alumna/liven/raw/master/liven.svg?sanitize=true" alt="liven" width="480" height="270" />
</div>

<div align="center">
	<a href="https://npmjs.org/package/@alumna/liven">
		<img src="https://badgen.now.sh/npm/v/@alumna/liven" alt="version" />
	</a>
	<a href="https://npmjs.org/package/@alumna/liven">
		<img src="https://badgen.net/bundlephobia/min/@alumna/liven" alt="size" />
	</a>
	<a href="https://travis-ci.org/alumna/liven">
		<img src="https://travis-ci.org/alumna/liven.svg?branch=master" alt="travis" />
	</a>
	<a href="https://codecov.io/gh/alumna/liven">
		<img src="https://codecov.io/gh/alumna/liven/branch/master/graph/badge.svg" />
	</a>
	<a href="https://npmjs.org/package/@alumna/liven">
		<img src="https://badgen.now.sh/npm/dm/@alumna/liven" alt="downloads" />
	</a>
</div>

<div align="center">Optimized and lightweight live reload library on 64kB, without dependencies</div>

<br/>

## Features

* Production version with **no dependencies**
* Extremely lightweight - 64kB!
* Alternative to `browser-sync` and `livereload`
* Excellent option to be used inside other libraries
* 100% tested and working on Linux, Mac and Windows!

This module is delivered as an ES Module:

* **ES Module**: [`dist/liven.js`](https://unpkg.com/@alumna/liven/dist/liven.js)


## Install

```
$ npm install @alumna/liven
```


## Usage

```js
import liven from '@alumna/liven';

const instance = await liven({

	// (OPTIONAL)
	// The current project's directory '.' will be used if `dir` isn't passed
	dir: './public_html/',

	// (OPTIONAL)
	// Port to use on the http server
	// If it isn't available, the first available port between 3000 and 3100 will be used 
	port: 3000,

	// (OPTIONAL)
	// Run as a SPA, mapping non-existent URL's to [base]index.html
	// Default to "false"
	spa: false,

	// (OPTIONAL)
	// Function (as string) to be runned on the browser when receiving a socket signal
	// Defaults to: 'function( data ){ location.reload( true ) };', that simply reloads the page
	// `data` is an object: { path, isDir, isFile, isNew, add_or_update }
	script: 'function( data ){ location.reload( true ) };',

	// (OPTIONAL)
	// Mask paths to a different directory when requested
	alias: {
		'images'    : 'optimized'
	},
	
	// (OPTIONAL)
	// Function to be called on each event, before the refresh signal
	// The function must return "true" to allow the refresh, of "false" to don't allow
	on_event: ({ path, isDir, isFile, isNew, add_or_update }) => {...},
	
});

// You can programatically force a refresh as well
instance.refresh({ path, isDir, isFile, add_or_update, isNew })


// Create a memory-file on the server
// It overwrites the file on the same path, if it exists, on future requests
// -
// "content" can be a string or a buffer
// -
// Path must be a fullpath or initiate without a slash ('/') when relative
// Will generate a refresh unless "on_event" function returns "false" for the path
// -
// It will be instantly available in all modes, including:
// SPA, index.html served on dir URL's, updating 404 files, etc
await instance.memory( path, content )

// Clear a memory-file on the server
// -
// If a file exists on the same path on disk,
// its original content will be served again on future requests
// -
// As on 'memory' feature:
// Path must be a fullpath or initiate without a slash ('/') when relative
// Will generate a refresh unless "on_event" function returns "false" for the path
// -
// The effect will be instantly available in all modes
await instance.clear( path )


// And get the port used
console.log( instance.port ) // 3000
```
