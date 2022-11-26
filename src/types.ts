import { Struct, InternalStruct } from './dynstruct.js';

/** Abstract integer type. */
export type int = number;

export type SharedStruct = Struct|InternalStruct;
export type ReturnsInt = () => int;
export type ReturnsStruct = () => SharedStruct;
export type ReturnsNull = () => null;

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
	group:	SharedStruct|ReturnsStruct|ReturnsNull|null,
	size:	int|ReturnsInt,
	endian:	boolean,
}

export type ExternalPart = {
	// Padding
	name?:		null,
	size?:		int|ReturnsInt,
	type:		14,
} | {
	// Regular (Only type)
	name:		string,
	size?:		int|ReturnsInt,
	endian?:	boolean,

	type:		int|ReturnsInt,
	group?:		null|ReturnsNull,
} | {
	// Regular (Only group)
	name:		string,
	size?:		int|ReturnsInt,
	endian?:	boolean,

	type?:		null|ReturnsNull,
	group:		SharedStruct|ReturnsStruct,
} | {
	// Regular (Both)
	name:		string,
	size?:		int|ReturnsInt,
	endian?:	boolean,

	type:		ReturnsNull|ReturnsInt,
	group:		ReturnsNull|ReturnsStruct,
}

