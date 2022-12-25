import { DTYPE, DBYTES, DSHORT, SINGLE, NULLSTOP, LITTLE_ENDIAN, BIG_ENDIAN, SYSTEM_ENDIAN } from './datatype.js';
import { int, Component, ReturnsInt, ReturnsNull, ReturnsStruct } from './types.js';
import { Struct } from './dynstruct.js';

export {
	DTYPE,
	DBYTES,
	DSHORT,
	
	SINGLE,
	NULLSTOP,

	LITTLE_ENDIAN,
	BIG_ENDIAN,
	SYSTEM_ENDIAN,

	Struct,
	Component,

	/**
	 * @deprecated This type has been renamed to Component for clarity!
	 * @alias Component
	 */
	Component as ExternalPart,

	ReturnsInt,
	ReturnsNull,
	ReturnsStruct,

	int,
};