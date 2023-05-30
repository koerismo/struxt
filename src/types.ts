import type { Literal } from './utils.js';

// Utils
export type Key<T> = Literal<T>|string;
export type Length<Key> = Key extends null ? number : number|string;
export type Arr<T> = ArrayLike<T>;
export type numbers = Arr<number>;

export type Unpacked = {[key: string]: any|any[]};
export type Packed = ArrayBufferLike;

/** The context holds the buffer data for all active pointers in a struct. */
export interface Context {
	object:	Unpacked;
	buffer:	ArrayBuffer;
	view:	DataView;
	array:	Uint8Array;
}

/** Pointers are used to touch data in the buffer/object. */
export interface Pointer {

	// Retrieves the absolute position of the pointer in the buffer.
	position(): number;

	// Retrieves the relative position of the pointer to the beginning of this chunk.
	length(): number;

	// Allocate the specified length for a new pointer.
	defer(length: number): Pointer;

	// Alignment
	pad(length: number): void;
	align(multiple: number, offset?: number): void;

	// Bool
	bool(key: Key<boolean>):											boolean;
	bool(key: Key<Arr<boolean>>,			length: number|string):		Arr<boolean>;
	bool(key: Key<boolean|Arr<boolean>>,	length?: number|string):	boolean|Arr<boolean>;

	// Struct
	struct(key: Key<Struct>):											Struct;
	struct(key: Key<Arr<Struct>>,			length: number|string):		Arr<Struct>;
	struct(key: Key<Struct|Arr<Struct>>,	length?: number|string):	Struct|Arr<Struct>;

	// String
	str(key: Key<string>, length: number|string):	string;

	// Uints
	u8(key: Key<number>):										number;
	u8(key: Key<numbers>,			length: number|string):		numbers;
	u8(key: Key<number|numbers>,	length?: number|string):	number|numbers;

	u16(key: Key<number>):										number;
	u16(key: Key<numbers>,			length: number|string):		numbers;
	u16(key: Key<number|numbers>,	length?: number|string):	number|numbers;

	u32(key: Key<number>):										number;
	u32(key: Key<numbers>,			length: number|string):		numbers;
	u32(key: Key<number|numbers>,	length?: number|string):	number|numbers;

	// Ints
	i8(key: Key<number>):										number;
	i8(key: Key<numbers>,			length: number|string):		numbers;
	i8(key: Key<number|numbers>,	length?: number|string):	number|numbers;

	i16(key: Key<number>):										number;
	i16(key: Key<numbers>,			length: number|string):		numbers;
	i16(key: Key<number|numbers>,	length?: number|string):	number|numbers;

	i32(key: Key<number>):										number;
	i32(key: Key<numbers>,			length: number|string):		numbers;
	i32(key: Key<number|numbers>,	length?: number|string):	number|numbers;

	// Floats
	f32(key: Key<number>):										number;
	f32(key: Key<numbers>,			length: number|string):		numbers;
	f32(key: Key<number|numbers>,	length?: number|string):	number|numbers;

	f64(key: Key<number>):										number;
	f64(key: Key<numbers>,			length: number|string):		numbers;
	f64(key: Key<number|numbers>,	length?: number|string):	number|numbers;
}

export interface Struct {
	exec: (ctx: Pointer) => void;

	// pack(data: Unpacked): Packed;
	pack_into(source: Unpacked, buffer: Packed, offset?: number): number;

	// unpack(data: Packed): Unpacked;
	unpack_into(target: Unpacked, buffer: Packed, offset?: number): number;
}