#!/usr/bin/env node
var fs       = require( 'fs' ),
	path     = require( 'path' ),

	mkdirp   = require( 'mkdirp' ),
	program  = require( 'commander' ),
	Templ8   = require( 'Templ8' ),
	n8iv     = require( 'n8iv' ),
	m8       = Templ8.m8.x( Object, Array, Boolean, Function, Number, String ),

	defaults = m8.obj();


function lines( str ) {
	return str.replace( /(["'])/g, "\\$1" );//.replace( /^(\s*)(.*)/, "$1'$2'" );
}

function toId( f ) {
	return program.prefix + f.substring( f.lastIndexOf( '/' ) + 1, f.lastIndexOf( program.extension ) );
}

function toSourceURL( f ) {
	return path.resolve( f );
}

function toTempl8( id, src, str ) {
	str = str.split( /[\n\r]/ ).compact( true ).map( lines ).join( '\',\n\'' );

	console.log( src + ' => ' + id );

	src = src.split( '/' );
	if ( src.length > 2 )
		src = src.slice( src.length - 2 );

	return m8.format( "new Templ8( m8.copy( { id : \'${0}\', sourceURL : \'${1}\'  }, config ), '${2}' );", id, src.join( '/' ), str );
}

function validFiles( f ) {
	var ext = program.extension;
	return ( f.lastIndexOf( ext ) === f.length - ext.length ) ? ( this + '/' + f ) : null;
}

defaults.config = function( config ) {
	var c = fs.readFileSync( config, program.charset );
	( c && c.length ) || ( c = '{}' );
	return c.trim();
};
defaults.dir = function( dir ) {
	var files = fs.readdirSync( dir ).mapc( validFiles, dir );
	if ( !files.length ) console.log( 'No valid files found in: ' + dir );
	return files;
};
defaults.extension = function( ext ) {
	 ext || ( ext = 'html' );
	 ext.indexOf( '.' ) || ( ext = ext.substring( 1 ) );
	 return '.' + ext;
};
defaults.output = function( f ) {
	var i    = f.lastIndexOf( '/' ),
		file = f.substring( i + 1 ),
		path = f.substring( 0, i );
	return { dir : path, file : file };
};
defaults.prefix = function( pfx ) {
	pfx || ( pfx = '' );
	pfx.length < 1 || pfx.endsWith( '.' ) || ( pfx += '.' );
	return pfx;
};

process.argv.length > 2 || process.argv.push( '-h' );

program.version( '0.9.11' )
	   .description( 'Generate Templ8s from your nice clean HTML.' )
	   .option( '-c, --config <file>',       'An optional Templ8 configuration include in all processed Templ8\'s.', defaults.config )
	   .option( '-cs, --charset [encoding]', 'File encoding. Defaults to utf-8.', 'utf-8' )
	   .option( '-d, --directory <path>',    'Create template file from the files in a directory. File name – minus the extension – is used as Templ8 ID.', defaults.dir )
	   .option( '-e, --extension [ext]',     'Only create templates from specific file types if \033[1;m-d\033[0m is specified. Defaults to "html".', defaults.extension, 'html' )
	   .option( '-f, --file <file>',         'Create template file from a single file.' )
	   .option( '-o, --output <file>',       'The name of the generated file. Defaults to \033[1;m./templates.js\033[0m.', defaults.output, './templates.js' )
	   .option( '-p, --prefix <namespace>',  'Prefix each Templ8\'s name with a common namespace.', defaults.prefix, '' )
	   .parse( process.argv );

if ( program.directory.length ) {
	output = ['!function() {', ( 'var config = ' + program.config + ';' )];

	program.directory.forEach( function( f ) {
		output.push( toTempl8( toId( f ), toSourceURL( f ), fs.readFileSync( f, program.charset ) ) );
	} );

	output.push( '}();' );

	mkdirp( program.output.dir );

	fs.writeFileSync( program.output.dir + '/' + program.output.file, output.join( '\n' ), program.charset );

	console.log( 'successfully created: ', ( program.output.dir + '/' + program.output.file ) );
}
