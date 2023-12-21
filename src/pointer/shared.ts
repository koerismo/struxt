import type { Context, Pointer } from '../types.js';

/** @internal This is a partially-implemented pointer class for shared methods. */
export class SharedPointer implements Partial<Pointer> {
	protected context: Context;
	protected little: boolean = false;
	public position: number = 0;

	constructor(context: Context, position: number=0) {
		this.context = context;
		if (position != null) this.seek(position);
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
		if (position < 0) throw(`Pointer.seek: Attempted to seek past start boundary!`);
		if (position > this.context.array.length) throw(`Pointer.seek: Attempted to seek past end boundary!`);
		this.position = position;
	}
}
