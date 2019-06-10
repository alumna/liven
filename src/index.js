import CheapWatch 			from 'cheap-watch';
import { createServer } 	from 'http';
import getport				from 'get-port';
import polka				from 'polka';
import sirv					from 'sirv';
import WebSocket			from 'ws';

import * as fs 				from 'fs';

class Liven {

	constructor ( options ) {

		this.options = options

		this.options.script = '<script>(new WebSocket("ws://"+(location.host))).onmessage=' + this.options.script + '</script>';

		// http server binded to polka
		this.polka          = polka( { server: createServer() } );
		this.polka.use( this.inject(), sirv( this.options.dir, { dev: true } ) )

	}

	async start () {

		// Get an available port to run
		this.port = await getport( { port: this.options.port || getport.makeRange( 3000, 3100 ) } );

		// Start servers
		const { server } = this.polka.listen( this.port )

		// Bind the socket server on the http one
		this.ws           = new WebSocket.Server( { server } );
		this.connections  = []

		// Add every new connection to the pool
		this.ws.on( 'connection', connection => this.connections.push( connection ) );

		// Asynchronously start the watcher
		return this.watch()

	}

	async watch () {

		const options = { dir: this.options.dir }

		if ( this.options.filter ) options.filter = this.options.filter

		// Create a Cheap-watch instance 
		this.cheapwatch = new CheapWatch( options );

		// Initialize the watching process
		await this.cheapwatch.init();

		this.cheapwatch.on( '+', args => this.check_event( args, true ) );
		this.cheapwatch.on( '-', args => this.check_event( args, false ) );

		return true;

	}

	async check_event ( args, add_or_update ) {

		const data = { path: args.path, isDir: args.stats.isDirectory(), isFile: args.stats.isFile(), add_or_update, isNew: args.isNew ? true : false }

		if ( typeof this.options.on_event === 'function' && !( await this.options.on_event( data ) ) ) return;

		this.refresh( data )

	}

	inject () {

		const options = this.options

		return function ( req, res, next ) {

			const index = options.dir + '/index.html';

			if ( ! [ '/', '/index.html' ].includes( req.url ) || !fs.existsSync( index ) ) return next();

			const content = fs.readFileSync( index , 'utf8' );
			return res.end( content.replace( '<body>', '<body>' + options.script ) );

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

	const minimal = {
		dir: process.cwd(),
		script: 'function( args ){ location.reload( true ) };'
	}

	Object.assign( minimal, options );

	const instance = new Liven( minimal )

	await instance.start();

	return instance;

};