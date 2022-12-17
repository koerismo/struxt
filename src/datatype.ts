import { int } from './types.js';

/** Constant used to identify directly-embedded components. */
export const SINGLE = -1;

/** Constant used to identify null-terminated variable length components. NOT IMPLEMENTED! */
// export const NULLSTOP = -2;

/** Unique integer constant representations of datatypes. */
export const DTYPE = {
	INT8: 		0,
	INT16:		1,
	INT32:		2,
	INT64:		3,

	UINT8:		4,
	UINT16:		5,
	UINT32:		6,
	UINT64:		7,

	FLOAT32:	8,
	FLOAT64:	9,
//	FLOAT128:	10,	(NOT IMPLEMENTED)

	CHAR:		11,
	STR:		12,

	BOOL:		13,

	/** Padding: Packs to 0x00 bytes, skipped when unpacking. */
	PADDING:	14,
	/** Null: Skipped when packing, unpacks to a null array. */
	NULL:		15,
} as const;

/** Sizes of each data type in bytes-per-unit. */
export const DBYTES = {
	0:		1,		// INT8
	1:		2,		// INT16
	2:		4,		// INT32
	3:		8,		// INT64

	4:		1,		// UINT8
	5:		2,		// UINT16
	6:		4,		// UINT32
	7:		8,		// UINT64

	8:		4,		// FLOAT32
	9:		8,		// FLOAT64
//	10:		16,		// FLOAT128 (NOT IMPLEMENTED)

	11:		1,		// CHAR
	12:		1,		// STR

	13:		1,		// BOOL

	14:		1,		// PADDING
	15:		0,		// NULL
} as const;

/** Shorthand single-letter identifiers for datatypes. */
export const DSHORT = {
	'x': DTYPE.PADDING,
	'X': DTYPE.NULL,

	'b': DTYPE.INT8,
	'B': DTYPE.UINT8,

	'h': DTYPE.INT16,
	'H': DTYPE.UINT16,

	'i': DTYPE.INT32,
	'I': DTYPE.UINT32,

	'l': DTYPE.INT32,
	'L': DTYPE.UINT32,

	'f': DTYPE.FLOAT32,
	'd': DTYPE.FLOAT64,

	'c': DTYPE.CHAR,
	's': DTYPE.STR,

	'?': DTYPE.BOOL,
} as const;

/* A table of irregular non-array format IDs. (Not compatible with SINGLE) */
export const DNARRAY: {[key: string]: true} = {
	12: true,		// STR
	14: true,		// PADDING
};


/* Global encoders/decoders for text transforms. */
const TEncoder = new TextEncoder();
const TDecoder = new TextDecoder();


/** This constant reports the current system's endianness. If true, the system is little-endian. This is used to perform various shortcuts in packing and unpacking. */
export const SYSTEM_ENDIAN = (new Uint8Array(new Uint16Array([255]).buffer)[0] === 255);
export const BIG_ENDIAN = false,
             LITTLE_ENDIAN = true;

/** Reverses the items of an array at an interval of (size). The input array's length must be a multiple of (size). */
function SwapOrder( target:Uint8Array, size:int ): Uint8Array {
	if ( size <= 1 ) return target;

	for ( let i=0; i<target.length; i++ ) {
		const mod_i = i%size;
		const opp_i = i+size - 2*mod_i - 1;
		if (mod_i+1 >= size/2 || opp_i >= target.length) continue;

		const tmp = target[i];
		target[i] = target[opp_i], target[opp_i] = tmp;
	}

	return target;
}

/** Datatype pack function, used internally by Construct. */
export function Pack( type:int, data:ArrayLike<number>|any|null, size:int, endianness:boolean ): Uint8Array {
	const bytes = _Pack(type, data, size);
	if (endianness !== SYSTEM_ENDIAN) SwapOrder(bytes, DBYTES[type]);
	return bytes;
}

/** Datatype pack function, used internally by Construct. */
export function Unpack( type:int, data:Uint8Array, size:number, endianness:boolean ): ArrayLike<number>|any|null {
	const bytes = new Uint8Array(data);
	if (endianness !== SYSTEM_ENDIAN) SwapOrder(bytes, DBYTES[type]);
	return _Unpack(type, bytes, size);
}

function _Pack( type:int, data:ArrayLike<number>|any|null, size:int ): Uint8Array {

	// Switch/case doesn't work for this, because javascript
	// can't handle duplicate const/let definitions even between cases.

	if (type !== DTYPE.NULL && type !== DTYPE.PADDING && data.length !== size) throw new RangeError(`Pack expected input of length ${size}, but received ${data.length} instead!`);

	/* 8-BIT INTEGER */

	if (type === DTYPE.UINT8) {
		return new Uint8Array( data );
	}

	if (type === DTYPE.INT8) {
		return new Uint8Array(new Int8Array(data).buffer);
	}

	/* 16-BIT INTEGER */

	if (type === DTYPE.UINT16) {
		return new Uint8Array(new Uint16Array(data).buffer);
	}

	if (type === DTYPE.INT16) {
		return new Uint8Array(new Int16Array(data).buffer);
	}

	/* 32-BIT INTEGER */

	if (type === DTYPE.UINT32) {
		return new Uint8Array(new Uint32Array(data).buffer);
	}

	if (type === DTYPE.INT32) {
		return new Uint8Array(new Int32Array(data).buffer);
	}

	/* FLOATS */

	if (type === DTYPE.FLOAT32) {
		return new Uint8Array(new Float32Array(data).buffer);
	}

	if (type === DTYPE.FLOAT64) {
		return new Uint8Array(new Float64Array(data).buffer);
	}

	/* STRINGS */

	if (type === DTYPE.CHAR) {
		return new Uint8Array(data);
	}

	if (type === DTYPE.STR) {
		return TEncoder.encode(data);
	}

	/* BOOL */

	if (type === DTYPE.BOOL) {
		return new Uint8Array( data );
	}

	/* PADDING */

	if (type === DTYPE.NULL) {
		return new Uint8Array(0);
	}

	if (type === DTYPE.PADDING) {
		return new Uint8Array(size).fill(0x00);
	}

	/* NOT FOUND */

	throw('Unrecognized datatype '+type+'!');
}

function _Unpack( type:int, data:Uint8Array, size:number ): ArrayLike<number>|any|null {

	// @ts-ignore
	if (!(data instanceof Uint8Array)) throw new TypeError(`Unpack expected Uint8Array, but received ${data.constructor.name} instead!`);
	if (data.length !== size*DBYTES[type] && type !== DTYPE.NULL && type !== DTYPE.PADDING) throw new RangeError(`Unpack expected input of length ${size*DBYTES[type]}, but received ${data.length} instead!`);

	/* 8-BIT INTEGER */

	if (type === DTYPE.UINT8) {
		return data;
	}

	if (type === DTYPE.INT8) {
		return new Int8Array(data.buffer);
	}

	/* 16-BIT INTEGER */

	if (type === DTYPE.UINT16) {
		return new Uint16Array(data.buffer);
	}

	if (type === DTYPE.INT16) {
		return new Int16Array(data.buffer);
	}

	/* 32-BIT INTEGER */

	if (type === DTYPE.UINT32) {
		return new Uint32Array(data.buffer);
	}

	if (type === DTYPE.INT32) {
		return new Int32Array(data.buffer);
	}

	/* FLOATS */

	if (type === DTYPE.FLOAT32) {
		return new Float32Array(data.buffer);
	}

	if (type === DTYPE.FLOAT64) {
		 return new Float64Array(data.buffer);
	}

	/* STRINGS */

	if (type === DTYPE.CHAR) {
		return data;
	}

	if (type === DTYPE.STR) {
		return TDecoder.decode(data);
	}

	/* BOOL */

	if (type === DTYPE.BOOL) {
		return data;
	}

	/* PADDING */

	if (type === DTYPE.NULL) {
		return new Array(size).fill(null);
	}

	if (type === DTYPE.PADDING) {
		return null;
	}


	throw('Unrecognized datatype '+type+'!');
}