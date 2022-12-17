import { BIG_ENDIAN, DTYPE as D, LITTLE_ENDIAN, Struct, SYSTEM_ENDIAN } from '../dist/index.js';
import { deepStrictEqual, strictEqual } from 'assert/strict';

const TEST_COUNT = 500;

export const __name__ = 'pack/unpack';

export default function() {
	run_test( LITTLE_ENDIAN );
	run_test( BIG_ENDIAN );
}

function run_test( endian ) {

	const pack_payload = {
		// Padding is not included in the payload.
		0: null,
		1: -1,
		2: 0xff,
		3: -1,
		4: 0xffff,
		5: -1,
		6: 0xffffffff,
		7: 1.2345677614212036,
		8: 1.2345678,
		9: new Uint8Array([0xff]),
		10: 'hello',
		11: 1,
	};

	// LONG-FORM STRUCT DEFINITION
	const _INIT_A = performance.mark('init-a');
	for ( let i=0; i<TEST_COUNT; i++ ) {
	var struct_a = new Struct();
	struct_a.add({            type: D.PADDING,  endian: endian });
	struct_a.add({ name: 0,   type: D.NULL,     endian: endian });
	struct_a.add({ name: 1,   type: D.INT8,     endian: endian });
	struct_a.add({ name: 2,   type: D.UINT8,    endian: endian });
	struct_a.add({ name: 3,   type: D.INT16,    endian: endian });
	struct_a.add({ name: 4,   type: D.UINT16,   endian: endian });
	struct_a.add({ name: 5,   type: D.INT32,    endian: endian });
	struct_a.add({ name: 6,   type: D.UINT32,   endian: endian });
	struct_a.add({ name: 7,   type: D.FLOAT32,  endian: endian });
	struct_a.add({ name: 8,   type: D.FLOAT64,  endian: endian });
	struct_a.add({ name: 9,   type: D.CHAR,     endian: endian, size: 1 });
	struct_a.add({ name: 10,  type: D.STR,      endian: endian, size: 5 });
	struct_a.add({ name: 11,  type: D.BOOL,     endian: endian });
	}

	// SHORT-FORM STRUCT DEFINITION
	const _INIT_B = performance.mark('init-b');
	for ( let i=0; i<TEST_COUNT; i++ ) {
	var struct_b = new Struct(
		(endian?'<':'>')+`
		xX
		bB
		hH
		iI
		fd
		1c
		5s
		?`);
	}

	// PACK DATA
	const _TEST_PACK = performance.mark('test-pack');
	for ( let i=0; i<TEST_COUNT; i++ ) {
	var bytes_a = struct_a.pack(pack_payload);
	var bytes_b = struct_b.pack(pack_payload);
	}

	// UNPACK DATA
	const _TEST_UNPACK = performance.mark('test-unpack');
	for ( let i=0; i<TEST_COUNT; i++ ) {
	var unpacked_a = struct_a.unpack(bytes_a);
	var unpacked_b = struct_b.unpack(bytes_a);
	}
	const _END = performance.mark('end');


	deepStrictEqual( bytes_a, bytes_b, 'Long-form and short-form structs do not produce the same results in pack!');
	deepStrictEqual( unpacked_a, unpacked_b, 'Long-form and short-form structs do not produce the same results in unpack!');
	deepStrictEqual( unpacked_a, pack_payload, 'Input and output data do not match!');

	console.log([
		{
			'endian': endian?'little':'big',
			'init A':performance.measure('', 'init-a', 'init-b').duration/TEST_COUNT,
			'init B':performance.measure('', 'init-b', 'test-pack').duration/TEST_COUNT,
			'pack':performance.measure('', 'test-pack', 'test-unpack').duration/TEST_COUNT,
			'unpack':performance.measure('', 'test-unpack', 'end').duration/TEST_COUNT,
		}
	]);

	return;
}