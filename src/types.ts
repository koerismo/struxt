import { Struct, InternalStruct } from './dynstruct.js';
import { DTYPE } from 'datatype.js';

/** Abstract integer type. */
export type int = number;

export type SharedStruct = Struct|InternalStruct;
export type ReturnsInt = (self: Struct) => int;
export type ReturnsStruct = (self: Struct) => SharedStruct;
export type ReturnsNull = (self: Struct) => null;

/** Component interface. */
export type Component =  {
	// Default part type
	name:		string,
	type?:		int|ReturnsInt|ReturnsNull|null,
	group?:		SharedStruct|ReturnsStruct|ReturnsNull|null,
	size?:		int|ReturnsInt,
	endian?:	boolean,
} | {
	// Padding part type
	type:		typeof DTYPE.PADDING,
	size?:		int|ReturnsInt,
} | {
	// Signature part type
	magic:		any,
	type:		int|ReturnsInt,
	size?:		int|ReturnsInt,
	endian?:	boolean,
}

/** Normalized Part interface, used internally. */
export type InternalComponent = {
	// Default part type
	name:		string,
	magic:		undefined,
	type:		int|ReturnsInt|ReturnsNull|null,
	group:		SharedStruct|ReturnsStruct|ReturnsNull|null,
	size:		int|ReturnsInt,
	endian:		boolean,
} | {
	// Padding part type
	name:		undefined,
	magic:		undefined,
	type:		typeof DTYPE.PADDING,
	group:		null,
	size:		int|ReturnsInt,
	endian:		null,
} | {
	// Signature part type.
	name:		undefined,
	magic:		any,
	type:		int|ReturnsInt,
	group:		null,
	size:		int|ReturnsInt,
	endian:		boolean,
}