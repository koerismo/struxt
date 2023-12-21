import type { SKey, AKey, Unpacked, Pointer, Key, Struct, key } from '../types.js';
import { Literal } from '../types.js';
import { SharedPointer } from './shared.js';
import equal from 'fast-deep-equal';

function assert_equal<T extends Object>(actual: Object, expected: T): asserts actual is T {
	if (!equal(actual, expected)) `Failed to match literal value!`;
	// if (typeof expected !== typeof actual) throw `Assert: value type ${typeof actual} does not match expected type ${typeof expected}!`;
	// if (typeof expected !== 'object' && actual !== expected) throw `Assert: value "${actual}" does not match expected value "${expected}"!`;
	// if (actual === null && expected !== null) throw `Assert: null value does not match expected value "${expected}"!`;
	// if (typeof expected === 'object') {
	// 	if (actual.constructor !== expected.constructor) throw `Assert: value constructor ${actual.constructor} does not match expected constructor ${expected.constructor}!`;
	// 	if ('length' in expected !== 'length' in actual) throw `Assert: Length type does not match!`;
	// 	if ('length' in expected && 'length' in actual && expected.length !== actual.length) throw `Assert: Expected length ${expected.length} but got length ${actual.length}`;
	// 	if ('length' in expected) {
	// 		// @ts-expect-error ignore it ignore it
	// 		for (let i=0; i<expected.length; i++) {
	// 			// @ts-expect-error want die
	// 			if (expected[i] !== actual[i]) throw `Assert: value ${actual[i]} at ${i} does not match expected!`;
	// 		}
	// 	}
	// }
}

const TD = new TextDecoder();

export class UnpackPointer<I extends Unpacked = Unpacked> extends SharedPointer implements Pointer<I> {
	#set_value(key: Key<I, any>, value: any) {
		if (key instanceof Literal) assert_equal(value, key.value);
		else this.context.object[<key>key] = value;
	}

	u8(key: SKey<I, number>): number;
	u8(key: AKey<I, number>, length: number): Uint8Array;
	u8(key: Key<I, number>, length?: number | undefined): number | Uint8Array {
		if (length === undefined) {
			const value = this.context.view.getUint8(this.position);
			this.context.object[<key>key] = value;
			this.position ++;
			return value;
		}

		const start = this.position;
		this.position += length;
		const arr = this.context.array.slice(start, this.position);
		this.#set_value(key, arr);
		return arr;
	}

	u16(key: SKey<I, number>): number;
	u16(key: AKey<I, number>, length: number): Uint16Array;
	u16(key: Key<I, number>, length?: number | undefined): number | Uint16Array {
		if (length === undefined) {
			const value = this.context.view.getUint16(this.position);
			this.#set_value(key, value);
			this.position += 2;
			return value;
		}

		const start = this.position;
		this.position += length * 2;
		const arr = new Uint16Array(length);
		for ( let i=0; i<length; i++ ) arr[i] = this.context.view.getUint16(start + i*2, this.little);
		this.#set_value(key, arr);
		return arr;
	}

	u32(key: SKey<I, number>): number;
	u32(key: AKey<I, number>, length: number): Uint32Array;
	u32(key: Key<I, number>, length?: number | undefined): number | Uint32Array {
		if (length === undefined) {
			const value = this.context.view.getUint32(this.position);
			this.#set_value(key, value);
			this.position += 4;
			return value;
		}

		const start = this.position;
		this.position += length * 4;
		const arr = new Uint32Array(length);
		for ( let i=0; i<length; i++ ) arr[i] = this.context.view.getUint32(start + i*4, this.little);
		this.#set_value(key, arr);
		return arr;
	}

	i8(key: SKey<I, number>): number;
	i8(key: AKey<I, number>, length: number): Int8Array;
	i8(key: Key<I, number>, length?: number | undefined): number | Int8Array {
		if (length === undefined) {
			const value = this.context.view.getInt8(this.position);
			this.#set_value(key, value);
			this.position ++;
			return value;
		}

		const start = this.position;
		this.position += length;
		const arr = new Int8Array(this.context.array.buffer.slice(start, this.position));
		this.#set_value(key, arr);
		return arr;
	}

	i16(key: SKey<I, number>): number;
	i16(key: AKey<I, number>, length: number): Int16Array;
	i16(key: Key<I, number>, length?: number | undefined): number | Int16Array {
		if (length === undefined) {
			const value = this.context.view.getInt16(this.position);
			this.#set_value(key, value);
			this.position += 2;
			return value;
		}

		const start = this.position;
		this.position += length * 2;
		const arr = new Int16Array(length);
		for ( let i=0; i<length; i++ ) arr[i] = this.context.view.getInt16(start + i*2, this.little);
		this.#set_value(key, arr);
		return arr;
	}

	i32(key: SKey<I, number>): number;
	i32(key: AKey<I, number>, length: number): Int32Array;
	i32(key: Key<I, number>, length?: number | undefined): number | Int32Array {
		if (length === undefined) {
			const value = this.context.view.getInt32(this.position);
			this.#set_value(key, value);
			this.position += 4;
			return value;
		}

		const start = this.position;
		this.position += length * 4;
		const arr = new Int32Array(length);
		for ( let i=0; i<length; i++ ) arr[i] = this.context.view.getInt32(start + i*4, this.little);
		this.#set_value(key, arr);
		return arr;
	}

	f32(key: SKey<I, number>): number;
	f32(key: AKey<I, number>, length: number): Float32Array;
	f32(key: Key<I, number>, length?: number | undefined): number | Float32Array {
		if (length === undefined) {
			const value = this.context.view.getFloat32(this.position);
			this.#set_value(key, value);
			this.position += 4;
			return value;
		}

		const start = this.position;
		this.position += length * 4;
		const arr = new Float32Array(length);
		for ( let i=0; i<length; i++ ) arr[i] = this.context.view.getFloat32(start + i*4, this.little);
		this.#set_value(key, arr);
		return arr;
	}

	f64(key: SKey<I, number>): number;
	f64(key: AKey<I, number>, length: number): Float64Array;
	f64(key: Key<I, number>, length?: number | undefined): number | Float64Array {
		if (length === undefined) {
			const value = this.context.view.getFloat64(this.position);
			this.#set_value(key, value);
			this.position += 8;
			return value;
		}

		const start = this.position;
		this.position += length * 8;
		const arr = new Float64Array(length);
		for ( let i=0; i<length; i++ ) arr[i] = this.context.view.getFloat64(start + i*8, this.little);
		this.#set_value(key, arr);
		return arr;
	}

	str(key: SKey<I, string>, length?: number): string {
		const start = this.position;
		let end = start + (length ?? 0);
		this.position = end;

		if (length === undefined) {
			for (end = start; end < this.context.array.length; end++)
				if (this.context.view.getUint8(end) === 0) break;
			this.position = end+1;
		}

		const value = TD.decode(this.context.array.slice(start, end));
		this.#set_value(key, value);
		return value;
	}

	struct<V extends Unpacked>(struct: Struct<V>, key: SKey<I, V>): V;
	struct<V extends Unpacked>(struct: Struct<V>, key: AKey<I, V>, length: number): V[];
	struct<V extends Unpacked>(struct: Struct<V>, key: Key<I, V>, length?: number): V | V[] {
		const src_array = this.context.array;

		if (length === undefined) {
			const value: Partial<V> = struct.type();
			const offset = src_array.byteOffset + this.position;
			this.position = struct.unpack(src_array.buffer, value, offset, src_array.length - offset);
			this.#set_value(key, value);
			return value as V;
		}

		const values: Partial<V>[] = new Array(length);
		for (let i=0; i<length; i++) {
			values[i] = struct.type();
			const offset = src_array.byteOffset + this.position;
			this.position = struct.unpack(src_array.buffer, values[i], offset, src_array.length - offset);
		}

		this.#set_value(key, values);
		return values as V[];
	}

	defer(length: number): Pointer<I> {
		const ref = new UnpackPointer<I>(this.context, this.position);
		this.position += length;
		return ref;
	}

	pointer(type: 'u16' | 'u32', offset: number=0): (func: (ctx: Pointer<I>) => void) => void {
		const value = this.context.view.getUint16(this.position, this.little);
		const ref = new UnpackPointer<I>(this.context, value + offset);
		this.position += 2;

		return (func) => {
			func(ref);
		}
	}
}