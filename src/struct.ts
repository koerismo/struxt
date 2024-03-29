import { Context } from './context.js';
import type { Pointer, Unpacked, Packed } from './types.js';
import { PackPointer } from './pack.js';
import { UnpackPointer } from './unpack.js';

export class Struct {
	exec: (ctx: Pointer) => void;

	constructor(exec: (ctx: Pointer) => void) {
		this.exec = exec;
	}

	pack_into(source: Unpacked, buffer: Packed, offset: number=0): number {
		const ctx = new Context(source, buffer);
		const ptr = new PackPointer(ctx, offset, buffer.byteLength, false);
		this.exec(ptr);
		return ptr._pos;
	}

	unpack_into(target: Unpacked, buffer: Packed, offset: number=0): number {
		const ctx = new Context(target, buffer);
		const ptr = new UnpackPointer(ctx, offset, buffer.byteLength, false);
		this.exec(ptr);
		return ptr._pos;
	}
}