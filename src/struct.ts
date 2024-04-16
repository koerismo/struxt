import type { Unpacked, Context, Pointer, Resolvable } from './types.js';
import { LengthPointer } from './pointer/length.js';
import { PackPointer } from './pointer/pack.js';
import { UnpackPointer } from './pointer/unpack.js';

type ExecFunction<I extends Unpacked, A extends unknown[]> = (ctx: Pointer<I>, ...args: A) => void;

/** @internal */
export function create_context(name: string, buffer: ArrayBuffer, object: Unpacked, pointers: Resolvable[]): Context {
	return {
		name,
		array: new Uint8Array(buffer),
		view: new DataView(buffer),
		object,
		pointers,
	}
}

export class Struct<I extends Unpacked = Unpacked, A extends any[] = any[]> {
	/** @internal Stores the exec function provided in the constructor. Do not call directly! */
	exec: ExecFunction<I, A>;
	/** @internal Stores the object constructor used when unpack pointers call Pointer.struct with this struct. */
	type: () => object;
	/** The struct name, used for tracking errors. */
	readonly name: string;

	constructor(exec: ExecFunction<I, A>, options?: { type?: (() => object), name?: string }) {
		this.exec = exec;
		this.type = options?.type ?? Object;
		this.name = options?.name ?? 'Struct';
	}

	/** Dry-runs a struct pack operation and returns the expected length. */
	length(source: Unpacked, ...args: A): number {
		const ptr = new LengthPointer<I>({ name: this.name, object: source }, 0, 0, Infinity);
		this.exec(ptr, ...args);
		return ptr.getpos(false);
	}

	/** Packs the struct into the specified buffer, returning the new absolute pointer position. */
	pack(source: I, target: ArrayBuffer): number;
	pack(source: I, target: ArrayBuffer, args: A): number;
	pack(source: I, target: ArrayBuffer, offset: number, args: A): number;
	pack(source: I, target: ArrayBuffer, offset: number, length: number, args: A): number;
	pack(source: I, target: ArrayBuffer, offset?: number|A, length?: number|A, args?: A): number {
		if (Array.isArray(length)) args = <A><unknown>length, length = undefined;
		if (Array.isArray(offset)) args = <A><unknown>offset, offset = undefined, length = undefined;
		
		args ??= <A><unknown>[];
		offset ??= 0;
		length ??= target.byteLength - offset;
		
		const ctx = create_context(this.name, target, source, []);
		const ptr = new PackPointer<I>(ctx, offset, offset, offset+length);
		this.exec(ptr, ...args);
		ptr.resolve();
		return ptr.getpos(false);
	}

	/** Unpacks the struct from the specified buffer, returning the new absolute pointer position. */
	unpack(source: ArrayBuffer, target: Partial<I>): number;
	unpack(source: ArrayBuffer, target: Partial<I>, args: A): number;
	unpack(source: ArrayBuffer, target: Partial<I>, offset: number, args: A): number;
	unpack(source: ArrayBuffer, target: Partial<I>, offset: number, length: number, args: A): number;
	unpack(source: ArrayBuffer, target: Partial<I>, offset?: number|A, length?: number|A, args?: A): number {
		if (Array.isArray(length)) args = <A><unknown>length, length = undefined;
		if (Array.isArray(offset)) args = <A><unknown>offset, offset = undefined, length = undefined;
		
		args ??= <A><unknown>[];
		offset ??= 0;
		length ??= source.byteLength - offset;
		
		const ctx = create_context(this.name, source, target, []);
		const ptr = new UnpackPointer<I>(ctx, offset, offset, offset+length);
		this.exec(ptr, ...args);
		return ptr.getpos(false);
	}
}
