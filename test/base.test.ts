import { Struct, Literal } from '../src/index.ts';
import assert from 'assert';

const data_numbers_LE = new Uint8Array([
	0x7B, 0x00, 0x00, 0x00, 0xD2, 0x04, 0x00, 0x00, 0x39, 0x30, 0x00, 0x00,
	0x85, 0x00, 0x00, 0x00, 0x2E, 0xFB, 0x00, 0x00, 0xC7, 0xCF, 0xFF, 0xFF,
	0xB7, 0x57, 0x00, 0x00, 0x79, 0xE9, 0xF6, 0x42, 0x0B, 0x0B, 0xEE, 0x07,
	0x3C, 0xDD, 0x5E, 0x40, 0xD9, 0x6D, 0x2D, 0x23, 0x5F, 0xB0, 0x52, 0xAB,
	0x9E, 0x0E, 0x15, 0x16, 0x90, 0x21, 0xDE, 0xEE
]);

const data_numbers_BE = new Uint8Array([
	0x7B, 0x00, 0x00, 0x00, 0x04, 0xD2, 0x00, 0x00, 0x00, 0x00, 0x30, 0x39,
	0x85, 0x00, 0x00, 0x00, 0xFB, 0x2E, 0x00, 0x00, 0xFF, 0xFF, 0xCF, 0xC7,
	0x57, 0xB7, 0x00, 0x00, 0x42, 0xF6, 0xE9, 0x79, 0x40, 0x5E, 0xDD, 0x3C,
	0x07, 0xEE, 0x0B, 0x0B, 0xAB, 0x52, 0xB0, 0x5F, 0x23, 0x2D, 0x6D, 0xD9,
	0xEE, 0xDE, 0x21, 0x90, 0x16, 0x15, 0x0E, 0x9E
]);


const input_numbers = {
	u8:  123,
	u16: 1234,
	u32: 12345,
	
	i8:  -123,
	i16: -1234,
	i32: -12345,
	
	f16: Math.f16round(123.456),
	f32: Math.fround(123.456),
	
	f64:  123.456789,
	u64:  12345123451234512345n,
	i64: -1234512345123451234n,
};

describe('Mode base tests', () => {
	const struct = new Struct((ctx, order: boolean|'LE'|'BE') => {
		ctx.order(order);

		ctx.u8('u8');

		ctx.align(0x4);
		ctx.u16('u16');

		ctx.align(0x4);
		ctx.u32('u32');
		
		ctx.i8('i8');

		ctx.align(0x4);
		ctx.i16('i16')
		
		ctx.align(0x4);
		ctx.i32('i32');
		
		ctx.f16('f16');

		ctx.align(0x4);
		ctx.f32('f32');

		ctx.f64('f64');
		ctx.u64('u64');
		ctx.i64('i64');
	});

	it('Length mode', () => {
		let length!: number;
		assert.doesNotThrow(() => {length = struct.length(input_numbers, ['LE'])});
		assert.strictEqual(length, 56);
		assert.doesNotThrow(() => {length = struct.length(input_numbers, ['BE'])});
		assert.strictEqual(length, 56);
	});

	it('Pack mode', () => {
		const packed = new Uint8Array(56);
		assert.doesNotThrow(() => struct.pack(input_numbers, packed.buffer, ['LE']));
		assert.deepStrictEqual(packed, data_numbers_LE);
		assert.doesNotThrow(() => struct.pack(input_numbers, packed.buffer, ['BE']));
		assert.deepStrictEqual(packed, data_numbers_BE);
	});

	it('Unpack mode', () => {
		let unpacked = {};
		assert.doesNotThrow(() => struct.unpack(data_numbers_LE.buffer, unpacked, ['LE']));
		assert.deepStrictEqual(unpacked, input_numbers);
		unpacked = {};
		assert.doesNotThrow(() => struct.unpack(data_numbers_BE.buffer, unpacked, ['BE']));
		assert.deepStrictEqual(unpacked, input_numbers);
	});
});