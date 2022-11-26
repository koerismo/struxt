/** This file defines the types used by Construct as well as their packing/unpacking methods. */

/** Abstract integer type. */
export type int = number;

/** Constant used to identify directly-embedded components. */
export const SINGLE = -1;

/** Unique integer constant representations of datatypes. */
export const DTYPE: {[key: string]: int }  = {
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
	FLOAT128:	10,

	CHAR:		11,
	STR:		12,

	BOOL:		13,

	/** Padding: Packs to 0x00 bytes, skipped when unpacking. */
	PADDING:	14,
	/** Null: Skipped when packing, unpacks to a null array. */
	NULL:		15,
};

/** Sizes of each data type in bytes-per-unit. */
export const DBYTES: {[key: int]: int } = {
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
	10:		16,		// FLOAT128

	11:		1,		// CHAR
	12:		1,		// STR

	13:		1,		// BOOL

	14:		1,		// PADDING
	15:		0,		// NULL
}

/** Shorthand single-letter identifiers for datatypes. */
export const DSHORT: {[key: string]: int } = {
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
}


/* Global encoders/decoders for text transforms. */
const TEncoder = new TextEncoder();
const TDecoder = new TextDecoder();


/** This constant reports the current system's endianness. If true, the system is little-endian. This is used to perform various shortcuts in packing and unpacking. */
export const SYSTEM_ENDIAN = (new Uint8Array(new Uint16Array([255]).buffer)[0] === 255);
export const BIG_ENDIAN = false,
             LITTLE_ENDIAN = true;

function supports_single( type:int ) {
	return ( type !== DTYPE.PADDING && type !== DTYPE.STR );
}

export function Pack( type:int, data:ArrayLike<number>|any|null, size:int, endianness:boolean ): Uint8Array {
	if (size === SINGLE) {
		if (supports_single(type)) return _Pack( type, [data], 1, endianness );
		return _Pack( type, data, 1, endianness );
	}
	else return _Pack( type, data, size, endianness );
}

export function Unpack( type:int, data:Uint8Array, size:int, endianness:boolean ): ArrayLike<number>|any|null {
	if (size === SINGLE) {
		if (supports_single(type)) return _Unpack( type, data, 1, endianness )[0];
		return _Unpack( type, data, 1, endianness );
	} 
	else return _Unpack( type, data, size, endianness );
}

/** Datatype pack function, used internally by Construct. */
export function _Pack( type:int, data:ArrayLike<number>|any|null, size:int, endianness:boolean ): Uint8Array {

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
		if (endianness === SYSTEM_ENDIAN) return new Uint8Array(new Uint16Array(data).buffer);

		let arr_out = new Uint8Array(data.length*2);
		let dataview = new DataView(arr_out.buffer);
		for ( let i=0; i<data.length; i++ ) dataview.setUint16(i*2, data[i], endianness);
		return arr_out;
	}

	if (type === DTYPE.INT16) {
		if (endianness === SYSTEM_ENDIAN) return new Uint8Array(new Int16Array(data).buffer);

		let arr_out = new Uint8Array(data.length*2);
		let dataview = new DataView(arr_out.buffer);
		for ( let i=0; i<data.length; i++ ) dataview.setInt16(i*2, data[i], endianness);
		return arr_out;
	}

	/* 32-BIT INTEGER */

	if (type === DTYPE.UINT32) {
		if (endianness === SYSTEM_ENDIAN) return new Uint8Array(new Uint32Array(data).buffer);

		let arr_out = new Uint8Array(data.length*4);
		let dataview = new DataView(arr_out.buffer);
		for ( let i=0; i<data.length; i++ ) dataview.setUint32(i*4, data[i], endianness);
		return arr_out;
	}

	if (type === DTYPE.INT32) {
		if (endianness === SYSTEM_ENDIAN) return new Uint8Array(new Int32Array(data).buffer);

		let arr_out = new Uint8Array(data.length*4);
		let dataview = new DataView(arr_out.buffer);
		for ( let i=0; i<data.length; i++ ) dataview.setInt32(i*4, data[i], endianness);
		return arr_out;
	}

	/* FLOATS */

	if (type === DTYPE.FLOAT32) {
		if (endianness === SYSTEM_ENDIAN) return new Uint8Array(new Float32Array(data).buffer);

		let arr_out = new Uint8Array(data.length*4);
		let dataview = new DataView(arr_out.buffer);
		for ( let i=0; i<data.length; i++ ) dataview.setFloat32(i*4, data[i], endianness);
		return arr_out;
	}

	if (type === DTYPE.FLOAT64) {
		if (endianness === SYSTEM_ENDIAN) return new Uint8Array(new Float64Array(data).buffer);

		let arr_out = new Uint8Array(data.length*8);
		let dataview = new DataView(arr_out.buffer);
		for ( let i=0; i<data.length; i++ ) dataview.setFloat64(i*8, data[i], endianness);
		return arr_out;
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

/** Datatype pack function, used internally by Construct. */
export function _Unpack( type:int, data:Uint8Array, size:number, endianness:boolean ): ArrayLike<number>|any|null {

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
		if (endianness === SYSTEM_ENDIAN) return new Uint16Array(data.buffer);

		let arr_out = new Uint16Array(size);
		let dataview = new DataView(data.buffer);
		for ( let i=0; i<size; i++ ) arr_out[i] = dataview.getUint16(i*2, endianness);
		return arr_out;
	}

	if (type === DTYPE.INT16) {
		if (endianness === SYSTEM_ENDIAN) return new Int16Array(data.buffer);

		let arr_out = new Int16Array(size);
		let dataview = new DataView(data.buffer);
		for ( let i=0; i<size; i++ ) arr_out[i] = dataview.getInt16(i*2, endianness);
		return arr_out;
	}

	/* 32-BIT INTEGER */

	if (type === DTYPE.UINT32) {
		if (endianness === SYSTEM_ENDIAN) return new Uint32Array(data.buffer);

		let arr_out = new Uint32Array(size);
		let dataview = new DataView(data.buffer);
		for ( let i=0; i<size; i++ ) arr_out[i] = dataview.getUint32(i*4, endianness);
		return arr_out;
	}

	if (type === DTYPE.INT32) {
		if (endianness === SYSTEM_ENDIAN) return new Int32Array(data.buffer);

		let arr_out = new Int32Array(size);
		let dataview = new DataView(data.buffer);
		for ( let i=0; i<size; i++ ) arr_out[i] = dataview.getInt16(i*4, endianness);
		return arr_out;
	}

	/* FLOATS */

	if (type === DTYPE.FLOAT32) {
		if (endianness === SYSTEM_ENDIAN) return new Float32Array(data.buffer);

		let arr_out = new Float32Array(size);
		let dataview = new DataView(data.buffer);
		for ( let i=0; i<size; i++ ) arr_out[i] = dataview.getFloat32(i*4, endianness);
		return arr_out;
	}

	if (type === DTYPE.FLOAT64) {
		if (endianness === SYSTEM_ENDIAN) return new Float64Array(data.buffer);

		let arr_out = new Float64Array(size);
		let dataview = new DataView(data.buffer);
		for ( let i=0; i<size; i++ ) arr_out[i] = dataview.getFloat64(i*8, endianness);
		return arr_out;
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