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