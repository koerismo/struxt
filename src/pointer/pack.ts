import type { SKey, AKey, Unpacked, Pointer, Key, TypeNameMap, key, Resolvable, Context } from '../types.js';
import { create_context, type Struct } from '../struct.js';
import { Literal, CustomOptions } from '../types.js';
import { SharedPointer } from './shared.js';

const TE = new TextEncoder();

/** @internal Use the generic Pointer<I> for types instead! */
export class PackPointer<I extends Unpacked = Unpacked> extends SharedPointer implements Pointer<I> {
	/** @internal */
	level: number;

	constructor(context: Context, start :number, position: number, end: number, level: number=0) {
		super(context, start, position, end);
		this.level = level;
	}

	#get_single_value<K extends keyof TypeNameMap>(key: key|Literal<any>, type: K): TypeNameMap[K] {
		const v = key instanceof Literal ? key.value : this.context.object[key];
		if (typeof v !== type) throw `${this.context.name}: Expected type ${type} for key ${key.toString()}, but got ${typeof v} instead!`;
		if (v == null) throw `${this.context.name}: Expected type ${type} for key ${key.toString()}, but got null/undefined instead!`;
		return v;
	}

	#get_array_value(key: key|Literal<any>, length: number): ArrayLike<any> {
		const v = key instanceof Literal ? key.value : this.context.object[key];
		if (v == null || typeof v !== 'object') throw `${this.context.name}: Expected array for key ${key.toString()}, but got ${typeof v} instead!`;
		if (v.length !== length) throw `${this.context.name}: Expected array of length ${length} for key ${key.toString()}, but got ${v.length} instead!`;
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
			this.context.view.setUint16(this.position, value, this.little);
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
			this.context.view.setUint32(this.position, value, this.little);
			this.position += 4;
			return value;
		}

		const value = new Uint32Array(this.#get_array_value(<key>key, length));
		const start = this.position;
		this.position += length * 4;
		for (let i=0; i<value.length; i++) this.context.view.setUint32(start + i*4, value[i], this.little);
		return value;
	}

	u64(key: SKey<I, bigint>): bigint;
	u64(key: AKey<I, bigint>, length: number): BigUint64Array;
	u64(key: Key<I, bigint>, length?: number): bigint | BigUint64Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'bigint');
			this.context.view.setBigUint64(this.position, value, this.little);
			this.position += 8;
			return value;
		}

		const value = new BigUint64Array(this.#get_array_value(<key>key, length) as BigUint64Array);
		const start = this.position;
		this.position += length * 8;
		for (let i=0; i<value.length; i++) this.context.view.setBigUint64(start + i*8, value[i], this.little);
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
			this.context.view.setInt16(this.position, value, this.little);
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
			this.context.view.setInt32(this.position, value, this.little);
			this.position += 4;
			return value;
		}

		const value = new Int32Array(this.#get_array_value(<key>key, length));
		const start = this.position;
		this.position += length * 4;
		for (let i=0; i<value.length; i++) this.context.view.setInt32(start + i*4, value[i], this.little);
		return value;
	}

	i64(key: SKey<I, bigint>): bigint;
	i64(key: AKey<I, bigint>, length: number): BigInt64Array;
	i64(key: Key<I, bigint>, length?: number): bigint | BigInt64Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'bigint');
			this.context.view.setBigInt64(this.position, value, this.little);
			this.position += 8;
			return value;
		}

		const value = new BigInt64Array(this.#get_array_value(<key>key, length) as BigInt64Array);
		const start = this.position;
		this.position += length * 8;
		for (let i=0; i<value.length; i++) this.context.view.setBigInt64(start + i*8, value[i], this.little);
		return value;
	}

	f32(key: SKey<I, number>): number;
	f32(key: AKey<I, number>, length: number): Float32Array;
	f32(key: Key<I, number>, length?: number): number | Float32Array {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'number');
			this.context.view.setFloat32(this.position, value, this.little);
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
			this.context.view.setFloat32(this.position, value, this.little);
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
			throw `${this.context.name}: Expected a string of length ${length} for key ${<key>key}, but got ${value.length} instead!`;
		}

		return value;
	}

	#exec_struct<T extends Unpacked>(struct: Struct<T>, object: Partial<Unpacked>, start: number, end: number) {
		const ctx = create_context(this.context.array.buffer, object, this.context.pointers);
		const ptr = new PackPointer<T>(ctx, start, start, end, this.level);
		struct.exec(ptr);
		return ptr.getpos(false);
	}

	struct<V extends Unpacked>(struct: Struct<V>, key: SKey<I, V>): V;
	struct<V extends Unpacked>(struct: Struct<V>, key: AKey<I, V>, length: number): V[];
	struct<V extends Unpacked>(struct: Struct<V>, key: Key<I, V>, length?: number): V | V[] {
		if (length === undefined) {
			const value = this.#get_single_value(<key>key, 'object') as V;
			this.position = this.#exec_struct(struct, value, this.position, this.end);
			return value;
		}

		const values = this.#get_array_value(<key>key, length) as V[];
		for (let i=0; i<length; i++) {
			this.position = this.#exec_struct(struct, values[i], this.position, this.end);
		}
		return values;
	}

	defer(length: number): Pointer<I> {
		const ref = new PackPointer<I>(this.context, this.position, this.position, this.position + length);
		this.position += length;
		return ref;
	}

	pointer(type: 'i16' | 'i32', relative: boolean=true, offset: number=0): (func: (ctx: Pointer<I>) => void) => void {
		const is_u16 = type === 'i16';
		if (relative) offset += this.start;
		const origin = this.position;
		const little = this.little;
		this.position += is_u16 ? 2 : 4;

		return (func) => {
			const resolve = ((prior: number) => {
				this.position = prior;
				this.context.view[is_u16 ? 'setInt16' : 'setInt32'](origin, this.position - offset, little);

				this.level += 1;
				func(this);
				this.level -= 1;

				return this.position;
			}) as Resolvable;

			resolve.level = this.level;
			this.context.pointers.push(resolve);
		}
	}

	/** @internal Forcefully resolves all current pointers. DO NOT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING! */
	resolve() {
		const pointers = this.context.pointers;

		let level = this.level, hits = 0;
		let offset = this.position;
		while (true) {
			hits = 0;
			for (let i=0; i<pointers.length; i++) {
				if (pointers[i].level !== level) continue;
				offset = pointers[i](offset);
				hits ++;
			}
			if (hits === 0) break;
			level ++;
		}
	}

	custom(opts: CustomOptions<I>) {
		opts.pack(this);
	}
}
