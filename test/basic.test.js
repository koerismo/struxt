import { Struct, Literal } from '../dist/index.js';
import assert from 'assert';

/** @type {Struct} */
var struct;
const arr = new Uint8Array(47);
const input = {
	test_1: 10,
	test_2: new Uint8Array([1,2,3,4]),
	test_3: new Uint16Array([1,2,3,4]),
	test_4: new Uint32Array([1,2,3,4]),
	test_5: 'test1',
	test_6: 'test2'
};

it('Creates a new struct', () => {
	struct = new Struct(buf => {
		const buf2 = buf.defer(2);
		buf.u8('test_1');
		buf.u8('test_2', 4);
		buf.u16('test_3', 4);
		buf.u32('test_4', 4);
		buf.str('test_5');
		buf.str('test_6', 5);
		buf.str(Literal('test3'), 5);
		buf2.u8(Literal([64, 128]), 2);
	});
});

it('Packs data', () => {
	const pointer = struct.pack_into(input, arr.buffer);
	assert.equal(pointer, 47);
});

it('Unpacks data', () => {
	const output = {};
	const pointer = struct.unpack_into(output, arr.buffer);

	assert.equal(pointer, 47);
	assert.deepStrictEqual(output, input);
})