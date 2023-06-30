import type { Arr, Context, Key, Pointer, Struct, Unpacked, numbers } from './types.js';
import { Literal, isArrayLike, untilTerminator } from './utils.js';

// REPLACE THIS WITH A PROPER SOLUTION FOR ENDIANNESS!!
const REPLACE_LITTLE = false;

function $handleOut<T>(self: UnpackPointer, key: Key<T>, value: T) {
	if (key instanceof Literal) {
		if (isArrayLike(value)) {
			for ( let i=0; i<value.length; i++ ) {
				// @ts-expect-error I am very tired and need to finish this asap
				if (value[i] !== key.value[i]) throw(`UnpackPointer: Literal value failed assertion! (expected ${key.value}, but found ${value})`);
			}
		}
		else if (value !== key.value) throw(`UnpackPointer: Literal value failed assertion! (expected ${key.value}, but found ${value})`);

	}
	else {
		self._ctx.object[key] = value;
	}
}

const TD = new TextDecoder();

export class UnpackPointer implements Pointer {
	_ctx: Context;
	_start: number;
	_pos: number;
	_end: number;
	_little: boolean;

	constructor(context: Context, start: number, end: number, little: boolean) {
		this._ctx = context;
		this._start = start;
		this._pos = start;
		this._end = end;
		this._little = little;
	}

	position(): number {
		return this._pos - this._start;
	}

	length(): number {
		return this._end - this._start;
	}

	defer(length: number): Pointer {
		const pointer = new UnpackPointer(this._ctx, this._pos, this._pos + length, this._little);
		this._pos += length;
		return pointer;
	}

	seek(position: number): void {
		this._pos = position + this._start;
		if (this._pos < this._start) throw(`UnpackPointer.seek: Attempted to seek past start boundary!`);
		if (this._pos > this._end) throw(`UnpackPointer.seek: Attempted to seek past end boundary!`);
	}

	order(little: boolean|'LE'|'BE'): void {
		if (little === 'BE') this._little = false;
		else this._little = !!little;
	}

	pad(length: number): void {
		this._pos += length;
	}

	align(multiple: number, offset?: number): void {
		this._pos = (offset ?? 0) + this._pos + this._start + (multiple - (this._pos - this._start) % multiple) % multiple;
	}

	bool(key: Key<boolean>): boolean;
	bool(key: Key<Arr<boolean>>, length: number): Arr<boolean>;
	bool(key: Key<boolean | Arr<boolean>>, length?: number): boolean | Arr<boolean> {
		let value: boolean | Array<boolean>;

		if (length === undefined) {
			value = !!this._ctx.view.getUint8(this._pos);
			this._pos += 2;
		}
		else {
			value = new Array<boolean>(length);
			for ( let i=0; i<length; i++ ) value[i] = !!this._ctx.view.getUint8(this._pos + i);
			this._pos += length;
		}

		$handleOut!(this, key, value);
		return value;
	}

	struct(struct: Struct, key: Key<Unpacked>): Unpacked;
	struct(struct: Struct, key: Key<Arr<Unpacked>>, length: number): Arr<Unpacked>;
	struct(struct: Struct, key: Key<Unpacked | Arr<Unpacked>>, length?: number): Unpacked | Arr<Unpacked> {
		let value;

		if (length === undefined) {
			value = <Unpacked>{};
			this._pos = struct.unpack_into(value, this._ctx.buffer, this._pos);
		}
		else {
			value = new Array<Unpacked>(length);
			for ( let i=0; i<length; i++ ) {
				value[i] = {};
				this._pos = struct.unpack_into(value[i], this._ctx.buffer, this._pos);
			}
		}

		$handleOut!(this, key, value);
		return value;
	}

	str(key: Key<string>, length?: number): string {
		let value: string;

		if (length === undefined) {
			const end = untilTerminator(this._ctx.view, this._pos, 0x00, 1);
			const encoded = this._ctx.buffer.slice(this._pos, end);
			value = TD.decode(encoded);
			this._pos = end + 1;
		}
		else {
			const encoded = this._ctx.buffer.slice(this._pos, this._pos + length);
			value = TD.decode(encoded);
			this._pos += length;
		}

		$handleOut!(this, key, value);
		return value;
	}

	u8(key: Key<number>): number;
	u8(key: Key<numbers>, length: number): numbers;
	u8(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Uint8Array;

		if (length === undefined) {
			value = this._ctx.view.getUint8(this._pos);
			this._pos ++;
		}
		else {
			value = this._ctx.array.slice(this._pos, this._pos + length);
			this._pos += length;
		}

		$handleOut!(this, key, value);
		return value;
	}

	u16(key: Key<number>): number;
	u16(key: Key<numbers>, length: number): numbers;
	u16(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Uint16Array;

		if (length === undefined) {
			value = this._ctx.view.getUint16(this._pos, REPLACE_LITTLE);
			this._pos += 2;
		}
		else {
			value = new Uint16Array(length);
			for ( let i=0; i<length; i++ ) value[i] = this._ctx.view.getUint16(this._pos + i*2, REPLACE_LITTLE);
			this._pos += length * 2;
		}

		$handleOut!(this, key, value);
		return value;
	}

	u32(key: Key<number>): number;
	u32(key: Key<numbers>, length: number): numbers;
	u32(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Uint32Array;

		if (length === undefined) {
			value = this._ctx.view.getUint32(this._pos, REPLACE_LITTLE);
			this._pos += 4;
		}
		else {
			value = new Uint32Array(length);
			for ( let i=0; i<length; i++ ) value[i] = this._ctx.view.getUint32(this._pos + i*4, REPLACE_LITTLE);
			this._pos += length * 4;
		}

		$handleOut!(this, key, value);
		return value;
	}

	i8(key: Key<number>): number;
	i8(key: Key<numbers>, length: number): numbers;
	i8(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Int8Array;

		if (length === undefined) {
			value = this._ctx.view.getInt8(this._pos);
			this._pos ++;
		}
		else {
			value = new Int8Array(this._ctx.buffer.slice(this._pos, this._pos + length));
			this._pos += length;
		}

		$handleOut!(this, key, value);
		return value;
	}

	i16(key: Key<number>): number;
	i16(key: Key<numbers>, length: number): numbers;
	i16(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Int16Array;

		if (length === undefined) {
			value = this._ctx.view.getInt16(this._pos, REPLACE_LITTLE);
			this._pos += 2;
		}
		else {
			value = new Int16Array(length);
			for ( let i=0; i<length; i++ ) value[i] = this._ctx.view.getInt16(this._pos + i*2, REPLACE_LITTLE);
			this._pos += length * 2;
		}

		$handleOut!(this, key, value);
		return value;
	}

	i32(key: Key<number>): number;
	i32(key: Key<numbers>, length: number): numbers;
	i32(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Int32Array;

		if (length === undefined) {
			value = this._ctx.view.getInt32(this._pos, REPLACE_LITTLE);
			this._pos += 4;
		}
		else {
			value = new Int32Array(length);
			for ( let i=0; i<length; i++ ) value[i] = this._ctx.view.getInt32(this._pos + i*4, REPLACE_LITTLE);
			this._pos += length * 4;
		}

		$handleOut!(this, key, value);
		return value;
	}

	f32(key: Key<number>): number;
	f32(key: Key<numbers>, length: number): numbers;
	f32(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Float32Array;

		if (length === undefined) {
			value = this._ctx.view.getFloat32(this._pos, REPLACE_LITTLE);
			this._pos += 4;
		}
		else {
			value = new Float32Array(length);
			for ( let i=0; i<length; i++ ) value[i] = this._ctx.view.getFloat32(this._pos + i*4, REPLACE_LITTLE);
			this._pos += length * 4;
		}

		$handleOut!(this, key, value);
		return value;
	}

	f64(key: Key<number>): number;
	f64(key: Key<numbers>, length: number): numbers;
	f64(key: Key<number | numbers>, length?: number): number | numbers {
		let value: number | Float64Array;

		if (length === undefined) {
			value = this._ctx.view.getFloat64(this._pos, REPLACE_LITTLE);
			this._pos += 8;
		}
		else {
			value = new Float64Array(length);
			for ( let i=0; i<length; i++ ) value[i] = this._ctx.view.getFloat64(this._pos + i*8, REPLACE_LITTLE);
			this._pos += length * 8;
		}

		$handleOut!(this, key, value);
		return value;
	}

}