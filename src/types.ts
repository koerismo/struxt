type KeysMatching<I, T> = {[K in keyof I]: I[K] extends T ? K : never}[keyof I];

export class Literal<T> {
	value: T;
	constructor(value: T) {
		this.value = value;
	}
}

export type key = string|number;
export type Unpacked = Record<key, any>;
export type SKey<I, T> = KeysMatching<I, T>; // | Literal<T>;
export type AKey<I, T> = KeysMatching<I, ArrayLike<T>>; // | Literal<T>;
export type Key<I, T> = KeysMatching<I, T> | KeysMatching<I, ArrayLike<T>> | Literal<T>;

export interface TypeNameMap {
	'string': string,
	'number': number,
	'bigint': bigint,
	'boolean': boolean,
	'object':  object,
}

export interface StructConstructor {
	new<I extends Unpacked = Unpacked>(exec: (ctx: Pointer<I>) => void): Struct<I>;
}

export interface Struct<I extends Unpacked> {
	length(source: I): number;

	pack(source: I, target: ArrayBuffer|Uint8Array, offset?: number, length?: number): number;

	unpack(source: ArrayBuffer|Uint8Array, target: Partial<I>, offset?: number, length?: number): number;
}

export interface Context {
	object:	Unpacked;
	view:	DataView;
	array:	Uint8Array;
}

export declare interface Pointer<I extends Unpacked> {
	/** @readonly The position of the pointer. Use seek(position: number) to modify it! */
	readonly position: number;

	// Uint

	u8(key: SKey<I, number>): number;
	u8(key: AKey<I, number>, length: number): Uint8Array;
	u8(key: Key<I, number>,  length?: number): number | Uint8Array;

	u16(key: SKey<I, number>): number;
	u16(key: AKey<I, number>, length: number): Uint16Array;
	u16(key: Key<I, number>,  length?: number): number | Uint16Array;

	u32(key: SKey<I, number>): number;
	u32(key: AKey<I, number>, length: number): Uint32Array;
	u32(key: Key<I, number>,  length?: number): number | Uint32Array;

	// u64(key: SKey<I, bigint>): bigint;
	// u64(key: AKey<I, bigint>, length: number): BigUint64Array;
	// u64(key: string, length: number): number | BigUint64Array;

	// Int

	i8(key: SKey<I, number>): number;
	i8(key: AKey<I, number>, length: number): Int8Array;
	i8(key: Key<I, number>,  length?: number): Int8Array;

	i16(key: SKey<I, number>): number;
	i16(key: AKey<I, number>, length: number): Int16Array;

	i32(key: SKey<I, number>): number;
	i32(key: AKey<I, number>, length: number): Int32Array;

	// i64(key: SKey<I, bigint>): bigint;
	// i64(key: AKey<I, bigint>, length: number): BigInt64Array;

	// Float

	f32(key: SKey<I, number>): number;
	f32(key: AKey<I, number>, length: number): Float32Array;
	// f32(key: Key<I, number>,  length: number): number | Float32Array;

	f64(key: SKey<I, number>): number;
	f64(key: AKey<I, number>, length: number): Float64Array;

	// Special

	str(key: SKey<I, string>): string;
	str(key: SKey<I, string>, length?: number): string;

	struct<V extends Unpacked>(struct: Struct<V>, key: SKey<I, V>): V;
	struct<V extends Unpacked>(struct: Struct<V>, key: AKey<I, V>, length: number): V[];

	defer(length: number): Pointer<I>;

	pointer(type: 'u16'|'u32', offset?: number): (func: (ctx: Pointer<I>) => void) => void;

	// Shared

	order(little: boolean|'LE'|'BE'): void;

	pad(length: number): void;

	align(multiple: number, offset?: number): void;
}
