import commonjs 		from 'rollup-plugin-commonjs';
import nodeResolve 		from 'rollup-plugin-node-resolve';
import { terser } 		from 'rollup-plugin-terser';

export default {
	input: 'src/index.js',

	external: [ 'bufferutil', 'crypto', 'events', 'fs', 'http', 'https', 'net', 'os', 'path', 'querystring', 'stream', 'tls', 'url', 'utf-8-validate', 'util', 'zlib' ],

	output: {
		file: 'dist/liven.cjs.js',
		format: 'cjs'
	},

	plugins: [

		nodeResolve( {
			preferBuiltins: true
		} ),

		commonjs(),

		terser()

	]
};