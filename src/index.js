import CheapWatch 			from 'cheap-watch';
import { createServer } 	from 'http';
import getport				from 'get-port';
import sirv					from 'sirv';
import WebSocket			from 'ws';

class Liven {

	constructor ( user_options ) {

		this.options      = Object.assign( { dir: '.' }, user_options );

		// http server
		const sirv_server = sirv( this.options.dir, { dev: true } );
		this.server       = createServer( sirv_server );

		// Bind the socket server on the http one
		this.ws           = new WebSocket.Server( { server: this.server } );
		this.connections  = []

		// Add every new connection to the pool
		this.ws.on( 'connection', connection => this.connections.push( connection ) );

	}

	async start () {

		// Get an available port to run
		this.port = await getport( { port: this.options.port || getport.makeRange( 3000, 3100 ) } );

		// Start servers 
		this.server.listen( this.port )

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

	refresh ( data ) {

		for ( let i = this.connections.length - 1; i >= 0; i-- ) {

			if ( this.connections[i].readyState === WebSocket.OPEN )
				this.connections[i].send( JSON.stringify( data ) );

		}

	}

}

export default async function ( user_options = {} ) {

	const instance = new Liven( user_options )

	await instance.start();

	return instance;

};