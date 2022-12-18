import { DTYPE as D, Struct } from '../dist/index.js';
import { deepStrictEqual, strictEqual } from 'assert/strict';

const TEST_COUNT = 500;

export const __name__ = 'dynamics';

export default function() {

	function return_group() {
		const ident = struct_a.eval('ident');
		switch (ident) {
			case 3:	return new Struct('4s');
			case 4:	return new Struct('4c');
			default: return null;
		}
	}

	function return_type() {
		const ident = struct_a.eval('ident');
		switch (ident) {
			case 1:	return D.INT32;
			case 2:	return D.FLOAT32;
			default: return null;
		}
	}

	const struct_a = new Struct();
	struct_a.add({ name: 'ident', type: D.UINT8 });
	struct_a.add({ name: 'body', type: return_type, group: return_group });

	for ( let i=1; i<=4; i++ ) {
		const arr = new Uint8Array([
			i,
			0x10,0x20,0x30,0x40,
		]);

		const unpacked = struct_a.unpack(arr);
		const repacked = struct_a.pack(unpacked);
		deepStrictEqual( arr, repacked, `Original buffer and repacked buffer do not match! (case ${i})` );
	}
}