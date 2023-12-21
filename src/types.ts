import type { Struct } from './struct.js';

type KeysMatching<I, T> = {[K in keyof I]: I[K] extends T ? K : never}[keyof I];

export class Literal<T> {
	value: T;
	constructor(value: T) {
		this.value = value;
	}
	toString() {
		if (this.value === null) return `Literal<null>`;
		if (typeof this.value === 'object') return `Literal<${this.value.constructor.name}>`;
		if (typeof this.value === 'string') return `Literal<"${this.value}">`;
		return `Literal<${this.value}>`;
	}
}

export type key = string|number;
export type Unpacked = Record<key, any>;
export type SKey<I, T> = KeysMatching<I, T> | Literal<T>;
export type AKey<I, T> = KeysMatching<I, ArrayLike<T>> | Literal<ArrayLike<T>>;
export type Key<I, T> = SKey<I, T> | AKey<I, T>;

/** @internal */
export interface TypeNameMap {
	'string': string,
	'number': number,
	'bigint': bigint,
	'boolean': boolean,
	'object':  object,
}

/** @internal */
export interface Context {
	object:	Unpacked;
	view:	DataView;
	array:	Uint8Array;
}

export declare interface Pointer<I extends Unpacked = Unpacked> {

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

	u64(key: SKey<I, bigint>): bigint;
	u64(key: AKey<I, bigint>, length: number): BigUint64Array;
	u64(key: Key<I, bigint>, length: number): bigint | BigUint64Array;

	// Int

	i8(key: SKey<I, number>): number;
	i8(key: AKey<I, number>, length: number): Int8Array;
	i8(key: Key<I, number>,  length?: number): number | Int8Array;

	i16(key: SKey<I, number>): number;
	i16(key: AKey<I, number>, length: number): Int16Array;
	i16(key: Key<I, number>,  length?: number): number | Int16Array;

	i32(key: SKey<I, number>): number;
	i32(key: AKey<I, number>, length: number): Int32Array;
	i32(key: Key<I, number>,  length?: number): number | Int32Array;

	i64(key: SKey<I, bigint>): bigint;
	i64(key: AKey<I, bigint>, length: number): BigInt64Array;
	i64(key: Key<I, bigint>, length: number): bigint | BigInt64Array;

	// Float

	f32(key: SKey<I, number>): number;
	f32(key: AKey<I, number>, length: number): Float32Array;
	f32(key: Key<I, number>,  length?: number): number | Float32Array;

	f64(key: SKey<I, number>): number;
	f64(key: AKey<I, number>, length: number): Float64Array;
	f32(key: Key<I, number>,  length?: number): number | Float64Array;

	// Special

	str(key: SKey<I, string>): string;
	str(key: SKey<I, string>, length?: number): string;

	struct<V extends Unpacked>(struct: Struct<V>, key: SKey<I, V>): V;
	struct<V extends Unpacked>(struct: Struct<V>, key: AKey<I, V>, length: number): V[];
	struct<V extends Unpacked>(struct: Struct<V>, key: Key<I, V>, length?: number): V | V[];

	/** Consumes N bytes, returning another pointer at the original position */
	defer(length: number): Pointer<I>;

	/** Returns a function that read/writes this pointer and modifies data at the target position.
	 * @param type The datatype for the pointer.
	 * @param relative Whether the pointer is relative to the struct's starting point. Defaults to true.
	 * @param offset The offset of the pointer. Ex. (2 = move an additional two bytes)
	 */
	pointer(type: 'i16'|'i32', relative?: boolean, offset?: number): (func: (ctx: Pointer<I>) => void) => void;

	// Shared

	/** Sets the byte order of the struct. This does not carry over between structs!
	 * @param little If a boolean is provided, true is equivalent to little-endian.
	 */
	order(little: boolean|'LE'|'BE'): void;

	pad(length: number): void;

	align(multiple: number, offset?: number): void;

	/** Gets the position of the pointer in the buffer.
	 * @param relative True by default. If set to false, the position will be reported relative to the start of the buffer instead of the struct.
	*/
	getpos(relative?: boolean): number;
}
