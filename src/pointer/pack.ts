import type { SKey, AKey, Unpacked, Pointer, Key, TypeNameMap, Struct, key } from '../types.js';
import { Literal } from '../types.js';
import { SharedPointer } from './shared.js';

const TE = new TextEncoder();

export class PackPointer<I extends Unpacked = Unpacked> extends SharedPointer implements Pointer<I> {

	#get_single_value<K extends keyof TypeNameMap>(key: key|Literal<any>, type: K): TypeNameMap[K] {
		const v = key instanceof Literal ? key.value : this.context.object[key];
		if (typeof v !== type) throw `Expected type ${type} for key ${key.toString()}, but got ${typeof v} instead!`;
		if (v == null) throw `Expected type ${type} for key ${key.toString()}, but got null/undefined instead!`;
		return v;
	}

	#get_array_value(key: key|Literal<any>, length: number): ArrayLike<any> {
		const v = key instanceof Literal ? key.value : this.context.object[key];
		if (v == null || typeof v !== 'object') throw `Expected array for key ${key.toString()}, but got ${typeof v} instead!`;
		if (v.length !== length) throw `Expected array of length ${length} for key ${key.toString()}, but got ${v.length} instead!`;
		return v;
	}

	u8(key: SKey<I, number>): number;
	u8(key: AKey<I, number>, length: number): Uint8Array;
	u8(key: Key<I, number>,  length?: number): number | Uint8Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setUint8(this.position, value);
			this.position ++;
			return value;
		}

		const value = new Uint8Array(this.#get_array_value(<string>key, length));
		this.context.array.set(value, this.position);
		this.position += length;
		return value;
	}

	u16(key: SKey<I, number>): number;
	u16(key: AKey<I, number>, length: number): Uint16Array;
	u16(key: Key<I, number>, length?: number): number | Uint16Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setUint16(this.position, value);
			this.position += 2;
			return value;
		}

		const value = new Uint16Array(this.#get_array_value(<string>key, length));
		const start = this.position;
		this.position += length * 2;
		for (let i=0; i<value.length; i++) this.context.view.setUint16(start + i*2, value[i], this.little);
		return value;
	}

	u32(key: SKey<I, number>): number;
	u32(key: AKey<I, number>, length: number): Uint32Array;
	u32(key: Key<I, number>, length?: number): number | Uint32Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setUint32(this.position, value);
			this.position += 4;
			return value;
		}

		const value = new Uint32Array(this.#get_array_value(<key>key, length));
		const start = this.position;
		this.position += length * 4;
		for (let i=0; i<value.length; i++) this.context.view.setUint32(start + i*4, value[i], this.little);
		return value;
	}

	i8(key: SKey<I, number>): number;
	i8(key: AKey<I, number>, length: number): Int8Array;
	i8(key: Key<I, number>, length?: number): number | Int8Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setInt8(this.position, value);
			this.position ++;
			return value;
		}

		const value = new Int8Array(this.#get_array_value(<key>key, length));
		this.context.array.set(value, this.position);
		this.position += length;
		return value;
	}

	i16(key: SKey<I, number>): number;
	i16(key: AKey<I, number>, length: number): Int16Array;
	i16(key: Key<I, number>, length?: number): number | Int16Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setInt16(this.position, value);
			this.position += 2;
			return value;
		}

		const value = new Int16Array(this.#get_array_value(<string>key, length));
		const start = this.position;
		this.position += length * 2;
		for (let i=0; i<value.length; i++) this.context.view.setInt16(start + i*2, value[i], this.little);
		return value;
	}

	i32(key: SKey<I, number>): number;
	i32(key: AKey<I, number>, length: number): Int32Array;
	i32(key: Key<I, number>, length?: number): number | Int32Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setInt32(this.position, value);
			this.position += 4;
			return value;
		}

		const value = new Int32Array(this.#get_array_value(<key>key, length));
		const start = this.position;
		this.position += length * 4;
		for (let i=0; i<value.length; i++) this.context.view.setInt32(start + i*4, value[i], this.little);
		return value;
	}

	f32(key: SKey<I, number>): number;
	f32(key: AKey<I, number>, length: number): Float32Array;
	f32(key: Key<I, number>, length?: number): number | Float32Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setFloat32(this.position, value);
			this.position += 4;
			return value;
		}

		const value = new Float32Array(this.#get_array_value(<key>key, length));
		const start = this.position;
		this.position += length * 4;
		for (let i=0; i<value.length; i++) this.context.view.setFloat32(start + i*4, value[i], this.little);
		return value;
	}

	f64(key: SKey<I, number>): number;
	f64(key: AKey<I, number>, length: number): Float64Array;
	f64(key: Key<I, number>, length?: number): number | Float64Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setFloat32(this.position, value);
			this.position += 8;
			return value;
		}

		const value = new Float64Array(this.#get_array_value(<key>key, length));
		const start = this.position;
		this.position += length * 8;
		for (let i=0; i<value.length; i++) this.context.view.setFloat64(start + i*8, value[i], this.little);
		return value;
	}

	str(key: SKey<I, string>): string;
	str(key: SKey<I, string>, length?: number): string {
		const value = this.#get_single_value(<key>key, 'string');
		const ref = new Uint8Array(this.context.array.buffer, this.context.array.byteOffset + this.position, this.context.array.byteLength - this.position);

		TE.encodeInto(value, ref);
		this.position += value.length

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
	struct<V extends Unpacked>(struct: Struct<V>, key: Key<I, V>, length?: number): V | V[] {
		const src_array = this.context.array;

		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'object') as V;
			const offset = src_array.byteOffset + this.position;
			this.position = struct.pack(value, src_array.buffer, offset, src_array.length - offset);
			return value;
		}

		const values = this.#get_array_value(<key>key, length) as V[];
		for (let i=0; i<length; i++) {
			const offset = src_array.byteOffset + this.position;
			this.position = struct.pack(values[i], src_array.buffer, offset, src_array.length - offset);
		}
		return values;
	}

	defer(length: number): Pointer<I> {
		const ref = new PackPointer<I>(this.context, this.position);
		this.position += length;
		return ref;
	}

	pointer(type: 'u16' | 'u32', offset: number=0): (func: (ctx: Pointer<I>) => void) => void {
		const origin = this.position;
		const little = this.little;
		this.position += 2;

		return (func) => {
			this.context.view.setUint16(origin, this.position - offset, little);
			func(this);
		}
	}
}
