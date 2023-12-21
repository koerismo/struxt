import type { Unpacked, Context, Pointer } from './types.js';
import { LengthPointer } from './pointer/length.js';
import { PackPointer } from './pointer/pack.js';
import { UnpackPointer } from './pointer/unpack.js';

type ExecFunction<I extends Unpacked> = (ctx: Pointer<I>) => void;

/** @internal */
function create_context(buffer: ArrayBuffer, object: Unpacked, start: number, length: number): Context {
	return {
		array: new Uint8Array(buffer, start, length),
		view: new DataView(buffer, start, length),
		object: object,
	}
}

export class Struct<I extends Unpacked = Unpacked> {
	private exec: ExecFunction<I>;
	type: () => object;

	constructor(exec: ExecFunction<I>, type: (() => object)=Object) {
		this.exec = exec;
		this.type = type;
	}

	length(source: Unpacked): number {
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
