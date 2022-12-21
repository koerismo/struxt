import { Struct, InternalStruct } from './dynstruct.js';

/** Abstract integer type. */
export type int = number;

export type SharedStruct = Struct|InternalStruct;
export type ReturnsInt = (self: Struct) => int;
export type ReturnsStruct = (self: Struct) => SharedStruct;
export type ReturnsNull = (self: Struct) => null;

/** Normalized Part interface, used internally. */
export type InternalPart = {
	// Default part type
	name:	string,
	type:	int|ReturnsInt|ReturnsNull|null,
	group:	SharedStruct|ReturnsStruct|ReturnsNull|null,
	size:	int|ReturnsInt,
	endian:	boolean,
} | {
	// Padding part type
	name:	null,
	type:	14,
	group:	null,
	size:	int|ReturnsInt,
	endian:	boolean,
}

export type ExternalPart =  {
	// Default part type
	name:	string,
	type?:	int|ReturnsInt|ReturnsNull|null,
	group?:	SharedStruct|ReturnsStruct|ReturnsNull|null,
	size?:	int|ReturnsInt,
	endian?:	boolean,
} | {
	// Padding part type
	name?:		null,
	type:		14,
	size?:		int|ReturnsInt,
}

/** Generic error for byte buffer exceptions. */
export function BufferError( msg:string ) {
	this.message	= msg;
	this.name		= 'BufferError';
}

/** Error for malformed Part keys. */
export function KeyError( msg:string ) {
	this.message	= msg;
	this.name		= 'KeyError';
}

/** Error for non-xor component function-value parameter evaluation. */
export function TypeXorError( msg:string ) {
	this.message	= msg;
	this.name		= 'TypeXorError';
}

/** Generic parser error. */
export function ParseError( msg:string ) {
	this.message	= msg;
	this.name		= 'ParseError';
}