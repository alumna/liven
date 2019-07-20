import CheapWatch 			from 'cheap-watch';
import { createServer } 	from 'http';
import getport				from 'get-port';
import { join, resolve }	from 'path';
import pulsa				from '@alumna/pulsa';
import WebSocket			from 'ws';

import * as fs 				from 'fs';

class Liven {

	constructor ( options ) {

		this.options        = options
		this.options.script = '<script>(new WebSocket("ws://"+(location.host))).onmessage=' + this.options.script + '</script>';
		this.index 			= join( this.options.dir, 'index.html' );

		const pulsa_options = {
			dir:   options.dir,
			spa:   options.spa,
			alias: options.alias
		}

		this.server = createServer( pulsa.serve( pulsa_options ) )
	}

	async start () {

		this.inject();

		// Get an available port to run
		this.port = await getport( { port: this.options.port || getport.makeRange( 3000, 3100 ) } );

		// Start servers
		this.server.listen( this.port )

		// Bind the socket server on the http one
		this.ws           = new WebSocket.Server( { server: this.server } );
		this.connections  = []

		// Add every new connection to the pool
		this.ws.on( 'connection', connection => this.connections.push( connection ) );

		// Asynchronously start the watcher
		return this.watch()

	}

	async watch () {

		// Create a Cheap-watch instance 
		this.cheapwatch = new CheapWatch( { dir: this.options.dir } );

		// Initialize the watching process
		await this.cheapwatch.init();

		this.cheapwatch.on( '+', args => this.check_event( args, true ) );
		this.cheapwatch.on( '-', args => this.check_event( args, false ) );

		return true;

	}

	async check_event ( args, add_or_update ) {

		if ( join( this.options.dir, args.path ) == this.index )
			this.inject();
		else
			pulsa.clear( join( this.options.dir, args.path ) )

		const data = { path: args.path, isDir: args.stats.isDirectory(), isFile: args.stats.isFile(), add_or_update, isNew: args.isNew ? true : false }

		this.check_on_event( data )

	}

	memory ( path, content ) {

		path = resolve( this.options.dir, path )

		if ( path == this.index )
			this.inject( content );
		else
			pulsa.memory( path, content )

		const data = {
			path: path.slice( this.index.length ),
			isDir: false,
			isFile: true,
			add_or_update: true,
			isNew: true
		}

		return this.check_on_event( data )

	}

	async check_on_event ( data ) {

		if ( typeof this.options.on_event === 'function' && !( await this.options.on_event( data ) ) )
			return;
		
		return this.refresh( data );

	}

	inject ( content ) {

		if ( content || fs.existsSync( this.index ) ) {

			content = content || fs.readFileSync( this.index , 'utf8' );
			content = content.replace( '<body>', '<body>' + this.options.script )

			pulsa.memory( this.index, content )

		}

	}

	refresh ( data ) {

		for ( let i = this.connections.length - 1; i >= 0; i-- ) {

			if ( this.connections[i].readyState === WebSocket.OPEN )
				this.connections[i].send( JSON.stringify( data ) );

		}

	}

}

export default async function ( options = {} ) {

	const minimal 	= {
		script: 'function( args ){ location.reload( true ) };',
		spa: 	false,
		alias: 	null
	}

	Object.assign( minimal, options );

	minimal.dir 	= resolve( minimal.dir || '.' );
	const instance 	= new Liven( minimal )

	await instance.start();

	return instance;

};