import type { Unpacked, Context, Pointer, Resolvable } from './types.js';
import { LengthPointer } from './pointer/length.js';
import { PackPointer } from './pointer/pack.js';
import { UnpackPointer } from './pointer/unpack.js';

type ExecFunction<I extends Unpacked> = (ctx: Pointer<I>) => void;

/** @internal */
export function create_context(buffer: ArrayBuffer, object: Unpacked, pointers: Resolvable[]): Context {
	return {
		array: new Uint8Array(buffer),
		view: new DataView(buffer),
		object: object,
		pointers: pointers,
	}
}

export class Struct<I extends Unpacked = Unpacked> {
	/** @internal Stores the exec function provided in the constructor. Do not call directly! */
	exec: ExecFunction<I>;
	/** @internal Stores the object constructor used when unpack pointers call Pointer.struct with this struct. */
	type: () => object;

	constructor(exec: ExecFunction<I>, type: (() => object)=Object) {
		this.exec = exec;
		this.type = type;
	}

	/** Dry-runs a struct pack operation and returns the expected length. */
	length(source: Unpacked): number {
		const ptr = new LengthPointer<I>(source, 0, 0, Infinity);
		this.exec(ptr);
		return ptr.getpos(false);
	}

	/** Packs the struct into the specified buffer, returning the new absolute pointer position. */
	pack(source: I, target: ArrayBuffer, offset: number=0, length: number=target.byteLength-offset): number {
		const ctx = create_context(target, source, []);
		const ptr = new PackPointer<I>(ctx, offset, offset, offset+length);
		this.exec(ptr);
		ptr.resolve();
		return ptr.getpos(false);
	}

	/** Unpacks the struct from the specified buffer, returning the new absolute pointer position. */
	unpack(source: ArrayBuffer, target: Partial<I>, offset: number=0, length: number=source.byteLength-offset): number {
		const ctx = create_context(source, target, []);
		const ptr = new UnpackPointer<I>(ctx, offset, offset, offset+length);
		this.exec(ptr);
		return ptr.getpos(false);
	}
}
