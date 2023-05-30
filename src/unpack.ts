import { Arr, Context, Key, Pointer, Struct, numbers } from './types.js';
import { Literal, isArrayLike, untilTerminator } from './utils.js';

export class UnpackPointer implements Pointer {
	#ctx: Context;
	#start: number;
	#pos: number;
	#end: number;

	constructor(context: Context, start: number, end: number) {
		this.#ctx = context;
		this.#start = start;
		this.#pos = start;
		this.#end = end;
	}

	position(): number {
		return this.#pos;
	}

	length(): number {
		return this.#pos - this.#start;
	}

	defer(length: number): Pointer {
		const pointer = new UnpackPointer(this.#ctx, this.#pos, this.#pos + length);
		this.#pos += length;
		return pointer;
	}

	pad(length: number): void {
		this.#pos += length;
	}

	align(multiple: number, offset?: number): void {
		this.#pos = offset + this.#pos + (multiple - this.#pos % multiple) % multiple;
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
				const end = untilTerminator(this.#ctx.view, this.#pos, length.charCodeAt(0), 1);
				value = this.#ctx.array.slice(this.#pos, end);
				this.#pos = end + 1;
			}

			else {
				value = this.#ctx.array.slice(this.#pos, this.#pos + length);
				this.#pos += length;
			}
		}

		else {
			value = this.#ctx.view.getUint8(this.#pos);
			this.#pos += 1;
		}

		if (key instanceof Literal) {
			// TODO: Make this assert the equality of the literal and value!
			return value;
		}

		else {
			this.#ctx.object[key] = value;
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