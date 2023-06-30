import { $$inline } from 'ts-macros';

import { Arr, Context, Key, Pointer, Struct, numbers } from './types.js';
import { Literal, isArrayLike } from './utils.js';

// REPLACE THIS WITH A PROPER SOLUTION FOR ENDIANNESS!!
const REPLACE_LITTLE = false;

function $key<T>(ctx: Context, key: Key<T>): T {
	return key instanceof Literal ? key.value : ctx.object[key];
}

function $packGeneric<T>(
	self: PackPointer,
	value: T|ArrayLike<T>,
	length: number|string|undefined,
	methodSingle: (v: T) => void,
	methodArray: (len: number, v: ArrayLike<T>) => void
	) {
		if (length === undefined) {
			if (typeof value !== 'number') throw(`PackPointer: Expected number, received ${value?.constructor.name} instead!`);
			$$inline!(methodSingle, [value]);
		}
		else {
			if (!isArrayLike(value)) throw(`PackPointer: Expected array-like, received ${value?.constructor.name} instead!`);
			if (typeof length === 'string') {
				$$inline!(methodArray, [value.length, value]);
				self._ctx.view.setUint8(this._pos, length.charCodeAt(0));
				this._pos += 1;
			}
			else {
				if (value.length !== length) throw(`PackPointer: Value length (${value.length}) does not match expected length! (${length})`);
				$$inline!(methodArray, [length, value]);
			}
		}
}

function $packNumber<T>(
	self: PackPointer,
	value: T|ArrayLike<T>,
	length: number|string|undefined,
	method: (v: T) => void
	) {
		if (length === undefined) {
			if (typeof value !== 'number') throw(`PackPointer: Expected number, received ${value?.constructor.name} instead!`);
			$$inline!(method, [value]);
		}
		else {
			if (!isArrayLike(value)) throw(`PackPointer: Expected array-like, received ${value?.constructor.name} instead!`);
			if (typeof length === 'string') {
				for ( let i=0; i<value.length; i++ ) {
					$$inline!(method, [value[i]]);
				}
				self._ctx.view.setUint8(this._pos, length.charCodeAt(0));
				this._pos += 1;
			}
			else {
				if (value.length !== length) throw(`PackPointer: Value length (${value.length}) does not match expected length! (${length})`);
				for ( let i=0; i<length; i++ ) {
					$$inline!(method, [value[i]]);
				}
			}
		}
}

const TE = new TextEncoder();

export class PackPointer implements Pointer {
	_ctx: Context;
	_start: number;
	_pos: number;
	_end: number;

	constructor(context: Context, start: number, end: number) {
		this._ctx = context;
		this._start = start;
		this._pos = start;
		this._end = end;
	}

	position(): number {
		return this._pos;
	}

	length(): number {
		return this._pos - this._start;
	}

	defer(length: number): Pointer {
		const pointer = new PackPointer(this._ctx, this._pos, this._pos + length);
		this._pos += length;
		return pointer;
	}

	seek(position: number): void {
		this._pos = position + this._start;
		if (this._pos < this._start) throw(`PackPointer.seek: Attempted to seek past start boundary!`);
		if (this._pos > this._end) throw(`PackPointer.seek: Attempted to seek past end boundary!`);
	}

	pad(length: number): void {
		this._pos += length;
	}

	align(multiple: number, offset?: number): void {
		this._pos = offset + this._pos + (multiple - this._pos % multiple) % multiple;
	}

	bool(key: Key<boolean>): boolean;
	bool(key: Key<Arr<boolean>>, length: string | number): Arr<boolean>;
	bool(key: Key<boolean | Arr<boolean>>, length?: string | number): boolean | Arr<boolean>;
	bool(key: Key<boolean | Arr<boolean>>, length?: string | number): boolean | Arr<boolean> {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setUint8(this._pos, 0xff * +!!value);
				this._pos ++;
			}
		);
		return value;
	}

	struct(key: Key<Struct>): Struct;
	struct(key: Key<Arr<Struct>>, length: string | number): Arr<Struct>;
	struct(key: Key<Struct | Arr<Struct>>, length?: string | number): Struct | Arr<Struct>;
	struct(key: Key<Struct | Arr<Struct>>, length?: string | number): Struct | Arr<Struct> {
		throw new Error('Method not implemented.');
	}

	str(key: Key<string>, length: string | number): string {
		const value = $key!(this._ctx, key);
		if (typeof value !== 'string') throw(`PackPointer: Expected string, received ${value?.constructor.name} instead!`);

		const encoded = TE.encode(value);
		if (typeof length === 'string') {
			this._ctx.array.set(encoded, this._pos);
			this._pos += value.length;
			this._ctx.view.setUint8(this._pos, length.charCodeAt(0));
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
	u8(key: Key<number | numbers>, length?: string | number): number | numbers;
	u8(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packGeneric!(this, value, length,
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
	u16(key: Key<numbers>, length: string | number): numbers;
	u16(key: Key<number | numbers>, length?: string | number): number | numbers;
	u16(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setUint16(this._pos, value, REPLACE_LITTLE);
				this._pos += 2;
			}
		);
		return value;
	}

	u32(key: Key<number>): number;
	u32(key: Key<numbers>, length: string | number): numbers;
	u32(key: Key<number | numbers>, length?: string | number): number | numbers;
	u32(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setUint32(this._pos, value, REPLACE_LITTLE);
				this._pos += 4;
			}
		);
		return value;
	}

	i8(key: Key<number>): number;
	i8(key: Key<numbers>, length: string | number): numbers;
	i8(key: Key<number | numbers>, length?: string | number): number | numbers;
	i8(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setInt8(this._pos, value);
				this._pos ++;
			}
		);
		return value;
	}

	i16(key: Key<number>): number;
	i16(key: Key<numbers>, length: string | number): numbers;
	i16(key: Key<number | numbers>, length?: string | number): number | numbers;
	i16(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setInt16(this._pos, value, REPLACE_LITTLE);
				this._pos += 2;
			}
		);
		return value;
	}

	i32(key: Key<number>): number;
	i32(key: Key<numbers>, length: string | number): numbers;
	i32(key: Key<number | numbers>, length?: string | number): number | numbers;
	i32(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setInt32(this._pos, value, REPLACE_LITTLE);
				this._pos += 4;
			}
		);
		return value;
	}

	f32(key: Key<number>): number;
	f32(key: Key<numbers>, length: string | number): numbers;
	f32(key: Key<number | numbers>, length?: string | number): number | numbers;
	f32(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setFloat32(this._pos, value, REPLACE_LITTLE);
				this._pos += 4;
			}
		);
		return value;
	}

	f64(key: Key<number>): number;
	f64(key: Key<numbers>, length: string | number): numbers;
	f64(key: Key<number | numbers>, length?: string | number): number | numbers;
	f64(key: Key<number | numbers>, length?: string | number): number | numbers {
		const value = $key!(this._ctx, key);
		$packNumber!(this, value, length,
			value => {
				this._ctx.view.setFloat64(this._pos, value, REPLACE_LITTLE);
				this._pos += 8;
			}
		);
		return value;
	}

}