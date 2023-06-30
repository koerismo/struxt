import { Arr, Context, Key, Pointer, Struct, numbers } from './types.js';
import { Literal, isArrayLike, untilTerminator } from './utils.js';

export class UnpackPointer implements Pointer {
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
		const pointer = new UnpackPointer(this._ctx, this._pos, this._pos + length);
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
		throw new Error('Method not implemented.');
	}

	struct(key: Key<Struct>): Struct;
	struct(key: Key<Arr<Struct>>, length: string | number): Arr<Struct>;
	struct(key: Key<Struct | Arr<Struct>>, length?: string | number): Struct | Arr<Struct>;
	struct(key: Key<Struct | Arr<Struct>>, length?: string | number): Struct | Arr<Struct> {
		throw new Error('Method not implemented.');
	}

	str(key: Key<string>, length: string | number): string {
		throw new Error('Method not implemented.');
	}

	u8(key: Key<number>): number;
	u8(key: Key<numbers>, length: number): numbers;
	u8(key: Key<number | numbers>, length?: string | number): number | numbers;
	u8(key: Key<number | numbers>, length?: string | number): number | numbers {
		let value: number | numbers;

		if (length !== undefined) {
			if (typeof length === 'string') {
				const end = untilTerminator(this._ctx.view, this._pos, length.charCodeAt(0), 1);
				value = this._ctx.array.slice(this._pos, end);
				this._pos = end + 1;
			}

			else {
				value = this._ctx.array.slice(this._pos, this._pos + length);
				this._pos += length;
			}
		}

		else {
			value = this._ctx.view.getUint8(this._pos);
			this._pos += 1;
		}

		if (key instanceof Literal) {
			// TODO: Make this assert the equality of the literal and value!
			return value;
		}

		else {
			this._ctx.object[key] = value;
			return value;
		}
	}

	u16(key: Key<number>): number;
	u16(key: Key<numbers>, length: string | number): numbers;
	u16(key: Key<number | numbers>, length?: string | number): number | numbers;
	u16(key: Key<number | numbers>, length?: string | number): number | numbers {
		throw new Error('Method not implemented.');
	}

	u32(key: Key<number>): number;
	u32(key: Key<numbers>, length: string | number): numbers;
	u32(key: Key<number | numbers>, length?: string | number): number | numbers;
	u32(key: Key<number | numbers>, length?: string | number): number | numbers {
		throw new Error('Method not implemented.');
	}

	i8(key: Key<number>): number;
	i8(key: Key<numbers>, length: string | number): numbers;
	i8(key: Key<number | numbers>, length?: string | number): number | numbers;
	i8(key: Key<number | numbers>, length?: string | number): number | numbers {
		throw new Error('Method not implemented.');
	}

	i16(key: Key<number>): number;
	i16(key: Key<numbers>, length: string | number): numbers;
	i16(key: Key<number | numbers>, length?: string | number): number | numbers;
	i16(key: Key<number | numbers>, length?: string | number): number | numbers {
		throw new Error('Method not implemented.');
	}

	i32(key: Key<number>): number;
	i32(key: Key<numbers>, length: string | number): numbers;
	i32(key: Key<number | numbers>, length?: string | number): number | numbers;
	i32(key: Key<number | numbers>, length?: string | number): number | numbers {
		throw new Error('Method not implemented.');
	}

	f32(key: Key<number>): number;
	f32(key: Key<numbers>, length: string | number): numbers;
	f32(key: Key<number | numbers>, length?: string | number): number | numbers;
	f32(key: Key<number | numbers>, length?: string | number): number | numbers {
		throw new Error('Method not implemented.');
	}

	f64(key: Key<number>): number;
	f64(key: Key<numbers>, length: string | number): numbers;
	f64(key: Key<number | numbers>, length?: string | number): number | numbers;
	f64(key: Key<number | numbers>, length?: string | number): number | numbers {
		throw new Error('Method not implemented.');
	}

}