import { Struct, Literal } from '../dist/index.js';
import assert from 'assert';

/** @type {Struct} */
var struct;
const arr = new Uint8Array(8);
const input = {
	test_1: 10,
	test_2: new Uint8Array([1,2,3,4]),
};

const expected_arr = new Uint8Array([
	 64, 128,  10,   1,
	  2,   3,   4,   0,
]);

it('Creates a new struct', () => {
	struct = new Struct(buf => {
		const buf2 = buf.defer(2);
		console.log('Test 1:', buf.u8('test_1'));
		console.log('Test 2:', buf.u8('test_2', 4));
		buf2.u8(Literal([64, 128]), 2);
	});
});

it('Packs data', () => {
	const pointer = struct.pack_into(input, arr.buffer);

	assert.equal(pointer, 7);
	assert.deepEqual(arr, expected_arr);
});

it('Unpacks data', () => {
	const output = {};
	const pointer = struct.unpack_into(output, arr.buffer);

	assert.equal(pointer, 7);
	assert.deepStrictEqual(output, input);
})