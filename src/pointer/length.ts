import type { SKey, AKey, Unpacked, Pointer, Context, Key, TypeNameMap, key } from '../types.js';
import type { Struct } from '../struct.js';
import { Literal, CustomOptions } from '../types.js';
import { SharedPointer } from './shared.js';

/** @internal Use the generic Pointer<I> for types instead! */
export class LengthPointer<I extends Unpacked = Unpacked> extends SharedPointer implements Pointer<I> {
	protected object: Unpacked;

	constructor(object: Unpacked, start: number, position: number, end: number) {
		super(<Context><unknown>null, start, position, end);
		this.object = object;
	}

	seek(position: number): void {
		if (position < 0) throw(`${this.context.name}: Pointer.seek: Attempted to seek past start boundary!`);
		this.position = position;
	}

	#get_single_value<K extends keyof TypeNameMap>(key: key|Literal<any>, type: K): TypeNameMap[K] {
		const literal = key instanceof Literal;
		const v = literal ? key.value : this.object[key];
		if (typeof v !== type) throw `${this.context.name}: Expected type ${type} for key ${key.toString()}, but got ${typeof v} instead!`;
		if (v == null) throw `${this.context.name}: Expected type ${type} for key ${key.toString()}, but got null/undefined instead!`;
		return v;
	}

	#get_array_value(key: key|Literal<any>, length: number): ArrayLike<any> {
		const literal = key instanceof Literal;
		const v = literal ? key.value : this.object[key];
		if (v == null || typeof v !== 'object') throw `${this.context.name}: Expected array for key ${key.toString()}, but got ${typeof v} instead!`;
		if (v.length !== length) throw `${this.context.name}: Expected array of length key ${length} for ${key.toString()}, but got ${v.length} instead!`;
		return v;
	}

	u8(key: SKey<I, number>): number;
	u8(key: AKey<I, number>, length: number): Uint8Array;
	u8(key: Key<I, number>,  length?: number): number | Uint8Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position ++;
			return value;
		}

		const value = new Uint8Array(this.#get_array_value(<key>key, length));
		this.position += length;
		return value;
	}

	u16(key: SKey<I, number>): number;
	u16(key: AKey<I, number>, length: number): Uint16Array;
	u16(key: Key<I, number>, length?: number): number | Uint16Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position += 2;
			return value;
		}

		const value = new Uint16Array(this.#get_array_value(<key>key, length));
		this.position += length * 2;
		return value;
	}

	u32(key: SKey<I, number>): number;
	u32(key: AKey<I, number>, length: number): Uint32Array;
	u32(key: Key<I, number>, length?: number): number | Uint32Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position += 4;
			return value;
		}

		const value = new Uint32Array(this.#get_array_value(<key>key, length));
		this.position += length * 4;
		return value;
	}

	u64(key: SKey<I, bigint>): bigint;
	u64(key: AKey<I, bigint>, length: number): BigUint64Array;
	u64(key: Key<I, bigint>, length?: number): bigint | BigUint64Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'bigint');
			this.position += 8;
			return value;
		}

		const value = new BigUint64Array(this.#get_array_value(<key>key, length) as BigUint64Array);
		this.position += length * 8;
		return value;
	}

	i8(key: SKey<I, number>): number;
	i8(key: AKey<I, number>, length: number): Int8Array;
	i8(key: Key<I, number>, length?: number): number | Int8Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position ++;
			return value;
		}

		const value = new Int8Array(this.#get_array_value(<key>key, length));
		this.position += length;
		return value;
	}

	i16(key: SKey<I, number>): number;
	i16(key: AKey<I, number>, length: number): Int16Array;
	i16(key: Key<I, number>, length?: number): number | Int16Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position += 2;
			return value;
		}

		const value = new Int16Array(this.#get_array_value(<key>key, length));
		this.position += length * 2;
		return value;
	}

	i32(key: SKey<I, number>): number;
	i32(key: AKey<I, number>, length: number): Int32Array;
	i32(key: Key<I, number>, length?: number): number | Int32Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position += 4;
			return value;
		}

		const value = new Int32Array(this.#get_array_value(<key>key, length));
		this.position += length * 4;
		return value;
	}

	i64(key: SKey<I, bigint>): bigint;
	i64(key: AKey<I, bigint>, length: number): BigInt64Array;
	i64(key: Key<I, bigint>, length?: number): bigint | BigInt64Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'bigint');
			this.position += 8;
			return value;
		}

		const value = new BigInt64Array(this.#get_array_value(<key>key, length) as BigInt64Array);
		this.position += length * 8;
		return value;
	}

	f32(key: SKey<I, number>): number;
	f32(key: AKey<I, number>, length: number): Float32Array;
	f32(key: Key<I, number>, length?: number): number | Float32Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position += 4;
			return value;
		}

		const value = new Float32Array(this.#get_array_value(<key>key, length));
		this.position += length * 4;
		return value;
	}

	f64(key: SKey<I, number>): number;
	f64(key: AKey<I, number>, length: number): Float64Array;
	f64(key: Key<I, number>, length?: number): number | Float64Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.position += 8;
			return value;
		}

		const value = new Float64Array(this.#get_array_value(<key>key, length));
		this.position += length * 8;
		return value;
	}

	str(key: SKey<I, string>): string;
	str(key: SKey<I, string>, length?: number): string {
		const value = this.#get_single_value(<key>key, 'string');
		this.position += value.length;

		if (length === undefined) {
			this.position ++;
		}
		else if (value.length !== length) {
			throw `Expected a string of length ${length} for key ${<key>key}, but got ${value.length} instead!`;
		}

		return value;
	}

	struct<V extends Unpacked>(struct: Struct<V>, key: SKey<I, V>): V;
	struct<V extends Unpacked>(struct: Struct<V>, key: AKey<I, V>, length: number): V[];
	struct<V extends Unpacked>(struct: Struct<V>, key: Key<I, V>, length?: number): V | V[]  {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'object') as V;
			this.position += struct.length(value);
			return value;
		}

		const values = this.#get_array_value(<key>key, length) as V[];
		for (let i=0; i<length; i++) {
			this.position += struct.length(values[i]);
		}
		return values;
	}

	defer(length: number): Pointer<I> {
		const ref = new LengthPointer<I>(this.context, this.position, this.position, this.position + length);
		this.position += length;
		return ref;
	}

	pointer(type: 'i16' | 'i32', relative: boolean=true, offset: number=0): (func: (ctx: Pointer<I>) => void) => void {
		this.position += type === 'i16' ? 2 : 4;

		return (func) => {
			func(this);
		}
	}

	custom(opts: CustomOptions<I>) {
		opts.length(this);
	}
}
