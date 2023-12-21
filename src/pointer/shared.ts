import type { Context, Pointer } from '../types.js';

/** @internal This is a partially-implemented pointer class for shared methods. */
export class SharedPointer implements Partial<Pointer> {
	protected context: Context;
	protected little: boolean = false;

	protected start: number;
	protected position: number = 0;
	protected end: number;

	constructor(context: Context, start :number, position: number, end: number) {
		this.context = context;
		this.start = start;
		this.end = end;
		if (start > end || start < 0 || end > this.context.array.buffer.byteLength) throw `Pointer constructed with invalid range [${start} -> ${end}]`;
		this.seek(position);
	}

	order(little: boolean|'LE'|'BE'): void {
		if (little === 'BE') this.little = false;
		else this.little = !!little;
	}

	pad(length: number): void {
		this.position += length;
	}

	align(multiple: number, offset?: number): void {
		this.position = (offset ?? 0) + this.position + (multiple - this.position % multiple) % multiple;
	}

	seek(position: number): void {
		if (position < this.start) throw(`Pointer.seek: Attempted to seek past start boundary!`);
		if (position > this.end) throw(`Pointer.seek: Attempted to seek past end boundary!`);
		this.position = position;
	}

	getpos(relative: boolean=true) {
		if (relative) return this.position - this.start;
		return this.position;
	}
}
