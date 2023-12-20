import type * as spec from './types.js';
import { LengthPointer } from './length.js';
import { PackPointer } from './pack.js';
import { UnpackPointer } from './unpack.js';

type ExecFunction<I extends spec.Unpacked> = (ctx: spec.Pointer<I>) => void;

function create_context(buffer: ArrayBuffer, object: spec.Unpacked, start: number, length: number): spec.Context {
	return {
		array: new Uint8Array(buffer, start, length),
		view: new DataView(buffer, start, length),
		object: object,
	}
}

export class Struct<I extends spec.Unpacked = spec.Unpacked> implements spec.Struct<I> {
	private exec: ExecFunction<I>;

	constructor(exec: ExecFunction<I>) {
		this.exec = exec;
	}

	length(source: spec.Unpacked): number {
		const ptr = new LengthPointer<I>(source);
		this.exec(ptr);
		return ptr.position;
	}

	pack(source: I, target: ArrayBuffer, offset: number=0, length: number=target.byteLength-offset): number {
		const ctx = create_context(target, source, offset, length);
		const ptr = new PackPointer<I>(ctx);
		this.exec(ptr);
		return ptr.position + offset;
	}

	unpack(source: ArrayBuffer, target: Partial<I>, offset: number=0, length: number=source.byteLength-offset): number {
		const ctx = create_context(source, target, offset, length);
		const ptr = new UnpackPointer<I>(ctx);
		this.exec(ptr);
		return ptr.position + offset;
	}
}
