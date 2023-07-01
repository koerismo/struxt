import type { Context as GenericContext, Unpacked, Packed } from './types.js';

export class Context implements GenericContext {
	object: Unpacked;
	buffer: Packed;
	view: DataView;
	array: Uint8Array;

	constructor(object: Unpacked, buffer: ArrayBuffer) {
		this.object = object;
		this.buffer = buffer;
		this.view = new DataView(buffer);
		this.array = new Uint8Array(buffer);
	}
}

export class SharedPointer {
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

	seek(position: number): void {
		this._pos = position + this._start;
		if (this._pos < this._start) throw(`PackPointer.seek: Attempted to seek past start boundary!`);
		if (this._pos > this._end) throw(`PackPointer.seek: Attempted to seek past end boundary!`);
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
}