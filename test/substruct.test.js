import { Struct, Literal } from '../dist/index.js';
import assert from 'assert';

const A = new Struct(ctx => {
	assert.equal(ctx.position(), 0);
	ctx.i32('value');
});

const B = new Struct(ctx => {
	ctx.struct(A, 'sub1', 3);
	ctx.struct(A, 'sub2');
});

const input = {
	sub1: [
		{ value: 1 },
		{ value: 2 },
		{ value: 3 }
	],
	sub2: { value: 4 }
}

const data = new Uint8Array(4 * 4);
it('Packs data with substructs', () => {
	B.pack_into(input, data.buffer);
})

it('Unpacks data with substructs', () => {
	const output = {};
	B.unpack_into(output, data.buffer);
	
	assert.deepStrictEqual(output, input);
})