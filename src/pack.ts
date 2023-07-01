import { $$inline } from 'ts-macros';

import type { Arr, Context, Key, Pointer, Struct, Unpacked, numbers } from './types.js';
import { Literal, isArrayLike } from './utils.js';
import { SharedPointer } from './context.js';

function $key<T>(ctx: Context, key: Key<T>): T {
	return key instanceof Literal ? key.value : ctx.object[key];
}

function $packGeneric<T>(
	value: T|ArrayLike<T>,
	length: number|undefined,
	methodSingle: (v: T) => void,
	methodArray: (len: number, v: ArrayLike<T>) => void,
	expectedType: string='number'
	) {
		if (length === undefined) {
			if (typeof value !== expectedType) throw(`PackPointer: Expected ${expectedType}, received ${value?.constructor.name} instead!`);
			$$inline!(methodSingle, [<T>value]);
		}
		else {
			if (!isArrayLike(value)) throw(`PackPointer: Expected array-like, received ${value?.constructor.name} instead!`);
			if (value.length !== length) throw(`PackPointer: Value length (${value.length}) does not match expected length! (${length})`);
			$$inline!(methodArray, [length, value]);
		}
}

function $packNumber<T>(
	value: T|ArrayLike<T>,
	length: number|undefined,
	method: (v: T) => void,
	expectedType: string='number'
	) {
		if (length === undefined) {
			if (typeof value !== expectedType) throw(`PackPointer: Expected ${expectedType}, received ${value?.constructor.name} instead!`);
			$$inline!(method, [<T>value]);
		}
		else {
			if (!isArrayLike(value)) throw(`PackPointer: Expected array-like, received ${value?.constructor.name} instead!`);
			if (value.length !== length) throw(`PackPointer: Value length (${value.length}) does not match expected length! (${length})`);
			for ( let i=0; i<length; i++ ) {
				$$inline!(method, [value[i]]);
			}
		}
}

const TE = new TextEncoder();

export class PackPointer extends SharedPointer implements Pointer {

	defer(length: number): Pointer {
		const pointer = new PackPointer(this._ctx, this._pos, this._pos + length, this._little);
		this._pos += length;
		return pointer;
	}

	bool(key: Key<boolean>): boolean;
	bool(key: Key<Arr<boolean>>, length: number): Arr<boolean>;
	bool(key: Key<boolean | Arr<boolean>>, length?: number): boolean | Arr<boolean> {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setUint8(this._pos, 0xff * +!!value);
				this._pos ++;
			},
			'boolean'
		);
		return value;
	}

	struct(struct: Struct, key: Key<Unpacked>): Unpacked;
	struct(struct: Struct, key: Key<Arr<Unpacked>>, length: number): Arr<Unpacked>;
	struct(struct: Struct, key: Key<Unpacked | Arr<Unpacked>>, length?: number): Unpacked | Arr<Unpacked> {
		const value = $key!(this._ctx, key);
		$packGeneric!(value, length,
			value => {
				this._pos = struct.pack_into(value, this._ctx.buffer, this._pos);
			},
			(len, value) => {
				for ( let i=0; i<len; i++ ) {
					this._pos = struct.pack_into(value[i], this._ctx.buffer, this._pos);
				}
			},
			'object'
		);
		return value;
	}

	str(key: Key<string>, length?: number): string {
		const value = $key!(this._ctx, key);

		// @ts-expect-error Input null check.
		if (typeof value !== 'string') throw(`PackPointer: Expected string, received ${value?.constructor.name} instead!`);

		const encoded = TE.encode(value);
		if (length === undefined) {
			this._ctx.array.set(encoded, this._pos);
			this._pos += value.length;
			this._ctx.view.setUint8(this._pos, 0x00);
			this._pos ++;
		}
		else {
			if (value.length !== length) throw(`PackPointer: Value length (${value.length}) does not match expected length! (${length})`);
			this._ctx.array.set(encoded, this._pos);
			this._pos += length;
		}

		return value;
	}

	u8(key: Key<number>): number;
	u8(key: Key<numbers>, length: number): numbers;
	u8(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packGeneric!(value, length,
			value => {
				this._ctx.view.setUint8(this._pos, value);
				this._pos ++;
			},
			(len, value) => {
				this._ctx.array.set(value, this._pos);
				this._pos += len;
			}
		);
		return value;
	}

	u16(key: Key<number>): number;
	u16(key: Key<numbers>, length: number): numbers;
	u16(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setUint16(this._pos, value, this._little);
				this._pos += 2;
			}
		);
		return value;
	}

	u32(key: Key<number>): number;
	u32(key: Key<numbers>, length: number): numbers;
	u32(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setUint32(this._pos, value, this._little);
				this._pos += 4;
			}
		);
		return value;
	}

	i8(key: Key<number>): number;
	i8(key: Key<numbers>, length: number): numbers;
	i8(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setInt8(this._pos, value);
				this._pos ++;
			}
		);
		return value;
	}

	i16(key: Key<number>): number;
	i16(key: Key<numbers>, length: number): numbers;
	i16(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setInt16(this._pos, value, this._little);
				this._pos += 2;
			}
		);
		return value;
	}

	i32(key: Key<number>): number;
	i32(key: Key<numbers>, length: number): numbers;
	i32(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setInt32(this._pos, value, this._little);
				this._pos += 4;
			}
		);
		return value;
	}

	f32(key: Key<number>): number;
	f32(key: Key<numbers>, length: number): numbers;
	f32(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setFloat32(this._pos, value, this._little);
				this._pos += 4;
			}
		);
		return value;
	}

	f64(key: Key<number>): number;
	f64(key: Key<numbers>, length: number): numbers;
	f64(key: Key<number | numbers>, length?: number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(value, length,
			value => {
				this._ctx.view.setFloat64(this._pos, value, this._little);
				this._pos += 8;
			}
		);
		return value;
	}

}