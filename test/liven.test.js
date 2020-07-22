import liven from './../src/index';

import * as fs 				from 'fs';
import http 				from 'http';
import { promisify } 		from 'util';

const read	  = promisify( fs.readFile );
const unlink  = promisify( fs.unlink );
const write	  = promisify( fs.writeFile );

const sleep = ms => new Promise( resolve => setTimeout( resolve, ms ) );

describe('Liven tests', () => {

	test('1. Refresh when file change', async ( done ) => {

		// If this test failed previously, lets guarantee that
		// everything is correct again before we begin
		const file    = 'test/01/index.html'
		const content = ( await read( file, 'utf8' ) ).replace( 'New title', 'Old title' );
		await write( file, content );

		await sleep( 130 )

		const server  = await liven( { dir: 'test/01' } );

		await page.goto( 'http://localhost:' + server.port );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Read and modify index.html to generate a refresh 
		await write( file, content.replace( 'Old title', 'New title' ) );

		// Wait the page to refresh
		await page.waitForNavigation( { waitUntil: 'load' } )

		await expect( page.title() ).resolves.toMatch( 'New title' );

		// Undo the changes
		await write( file, content );

		done();

	});

	test('2. Refresh after "on_event" returning "true"', async ( done ) => {

		// If this test failed previously, lets guarantee that
		// everything is correct again before we begin
		const file    = 'test/02/index.html'
		const content = ( await read( file, 'utf8' ) ).replace( 'New title', 'Old title' );
		await write( file, content );

		await sleep( 130 )

		const server  = await liven( { dir: 'test/02', on_event: () => true } );

		await page.goto( 'http://localhost:' + server.port );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Read and modify index.html to generate a refresh 
		await write( file, content.replace( 'Old title', 'New title' ) );

		// Wait the page to refresh
		await page.waitForNavigation( { waitUntil: 'load' } )

		await expect( page.title() ).resolves.toMatch( 'New title' );

		// Undo the changes
		await write( file, content );

		done();

	});

	test('3. Do not refresh after "on_event" returning "false"', async ( done ) => {

		// If this test failed previously, lets guarantee that
		// everything is correct again before we begin
		const file    = 'test/03/index.html'
		const content = ( await read( file, 'utf8' ) ).replace( 'New title', 'Old title' );
		await write( file, content );

		await sleep( 130 )

		const server  = await liven( { dir: 'test/03', on_event: () => false } );

		await page.goto( 'http://localhost:' + server.port );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Read and modify index.html to generate a refresh 
		await write( file, content.replace( 'Old title', 'New title' ) );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Undo the changes
		await write( file, content );

		done();

	});

	test('4. Refresh when file change, with a filter on watcher', async ( done ) => {

		// If this test failed previously, lets guarantee that
		// everything is correct again before we begin
		const file    = 'test/04/index.html'
		const content = ( await read( file, 'utf8' ) ).replace( 'New title', 'Old title' );
		await write( file, content );

		await sleep( 130 )

		const server  = await liven( { dir: 'test/04', filter: () => true } );

		await page.goto( 'http://localhost:' + server.port );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Read and modify index.html to generate a refresh 
		await write( file, content.replace( 'Old title', 'New title' ) );

		// Wait the page to refresh
		await page.waitForNavigation( { waitUntil: 'load' } )

		await expect( page.title() ).resolves.toMatch( 'New title' );

		// Undo the changes
		await write( file, content );

		done();

	});

	test('5. Refresh when a file is removed', async ( done ) => {

		// If this test failed previously, lets guarantee that
		// everything is correct again before we begin
		const file    = 'test/05/index.html'
		const content = ( await read( file, 'utf8' ) ).replace( 'New title', 'Old title' );
		await write( file, content );

		const to_delete = 'test/05/delete_test'
		await write( to_delete, 'delete test', 'utf8' );
		// fs.closeSync( fs.openSync( to_delete, 'w' ) );
		// await write( to_delete, 'delete test', 'utf8' );

		await sleep( 130 )

		const server  = await liven( { dir: 'test/05', filter: ( { path } ) => { return path == 'index.html' ? false : true } } );

		await page.goto( 'http://localhost:' + server.port );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Read and modify index.html to generate a refresh 
		await write( file, content.replace( 'Old title', 'New title' ) );

		// Generate a refresh deleting "delete_test"
		await unlink( to_delete );

		// Wait the page to refresh
		await page.waitForNavigation( { waitUntil: 'load' } );

		await expect( page.title() ).resolves.toMatch( 'New title' );

		// Undo the changess
		await write( file, content );
		await write( to_delete, 'delete test', 'utf8' );

		done();

	});

	test('6. Refresh when a file is created', async ( done ) => {

		// If this test failed previously, lets guarantee that
		// everything is correct again before we begin
		const file    = 'test/06/index.html'
		const content = ( await read( file, 'utf8' ) ).replace( 'New title', 'Old title' );
		await write( file, content );

		// Delete the file "create_test" if it exists
		const to_create = 'test/06/create_test'
		try {
			await unlink( to_create );
		} catch ( error ) {
		    // continue
		}

		try {
			await unlink( to_create );
		} catch ( error ) {
		    // continue
		}

		await sleep( 130 )

		const server  = await liven( { dir: 'test/06', filter: ( { path } ) => { return path == 'index.html' ? false : true } } );

		await page.goto( 'http://localhost:' + server.port );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Read and modify index.html to generate a refresh 
		await write( file, content.replace( 'Old title', 'New title' ) );

		// Generate a refresh deleting "create_test"
		fs.closeSync( fs.openSync( to_create, 'w' ) );
		await write( to_create, 'create test', 'utf8' );

		// Wait the page to refresh
		// await sleep( 130 )
		await page.waitForNavigation( { waitUntil: 'load' } );

		await expect( page.title() ).resolves.toMatch( 'New title' );

		// Undo the changess
		await write( file, content );
		try {
			await unlink( to_create );
		} catch ( error ) {
		    // continue
		}

		done();

	});

	test('7. Current dir used when passing no parameters', async ( done ) => {

		const original_cwd = process.cwd();
		process.chdir( 'test/07/' )

		// If this test failed previously, lets guarantee that
		// everything is correct again before we begin
		const file    = 'index.html'
		const content = ( await read( file, 'utf8' ) ).replace( 'New title', 'Old title' );
		await write( file, content );

		await sleep( 130 )



		const server  = await liven();

		await page.goto( 'http://localhost:' + server.port );

		await expect( page.title() ).resolves.toMatch( 'Old title' );

		// Read and modify index.html to generate a refresh 
		await write( file, content.replace( 'Old title', 'New title' ) );

		// Wait the page to refresh
		await page.waitForNavigation( { waitUntil: 'load' } )

		await expect( page.title() ).resolves.toMatch( 'New title' );

		// Undo the changes
		await write( file, content );
		process.chdir( original_cwd )

		done();

	});

	test('8. Remap a diretory to another', async ( done ) => {

		const server  = await liven({
			dir: 'test/08',
			alias: {
				'images/': 'compressed/'
			}
		});

		await sleep( 130 )

		await page.goto( 'http://localhost:' + server.port + '/images/img.txt' );

		await expect( page ).toMatch( 'compressed image' )

		done();

	});

	test('9. Don\'t inject code on non-existent index (404)"', async done => {

		const server  = await liven( { dir: 'test/09' } );

		http.get( 'http://localhost:' + server.port, response => {

			expect( response.statusCode ).toBe( 404 );
			done();

		})

		done();

	});

	test('10. Memory INDEX files', async ( done ) => {

		const server = await liven( { dir: 'test/10' } );

		// index.html from the disk
		await page.goto( 'http://localhost:' + server.port );
		await expect( page ).toMatch( 'Hello world in the disk' );
		await sleep( 130 )

		// index.html from memory
		await server.memory( 'index.html', '<html><body> Hello world in memory! </body></html>' )
		await sleep( 130 )
		// await page.goto( 'http://localhost:' + server.port );
		await expect( page ).toMatch( 'Hello world in memory!' );


		// Updating index.html from memory
		await server.memory( 'index.html', '<html><body> Hello UPDATED world in memory! </body></html>' )
		await sleep( 130 )
		await expect( page ).toMatch( 'Hello UPDATED world in memory!' );


		// Clearing index.html, reading from the disk
		await server.clear( 'index.html' )
		await sleep( 130 )
		await expect( page ).toMatch( 'Hello world in the disk' );

		done();

	});

	test('11. Memory NON-INDEX files', async ( done ) => {

		const server = await liven( { dir: 'test/11' } );

		// index.html from the disk
		await page.goto( 'http://localhost:' + server.port + '/other.html' );
		await sleep( 130 )
		await expect( page ).toMatch( 'Hello other in the disk' );

		// other.html
		await server.memory( 'other.html', '<html><body> Hello other in memory! </body><script type="text/javascript">(new WebSocket("ws://"+(location.host))).onmessage=function( args ){ location.reload( true ) };</script></html>' )
		await sleep( 130 )
		await expect( page ).toMatch( 'Hello other in memory!' );

		// Updating other.html
		await server.memory( 'other.html', '<html><body> Hello other UPDATED in memory! </body><script type="text/javascript">(new WebSocket("ws://"+(location.host))).onmessage=function( args ){ location.reload( true ) };</script></html>' )
		await sleep( 130 )
		await expect( page ).toMatch( 'Hello other UPDATED in memory!' );

		// Clearing other.html, reading from the disk
		await server.clear( 'other.html' )
		await sleep( 130 )
		await expect( page ).toMatch( 'Hello other in the disk' );

		done();

	});


});