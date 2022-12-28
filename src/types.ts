import { Struct, InternalStruct, StructContext } from './dynstruct.js';
import { DTYPE } from 'datatype.js';

/** Abstract integer type. */
export type int = number;

export type SharedStruct = Struct|InternalStruct;
export type ReturnsInt = (context: StructContext) => int;
export type ReturnsStruct = (context: StructContext) => SharedStruct;
export type ReturnsNull = (context: StructContext) => null;

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