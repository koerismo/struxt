import { Struct, Literal } from '../src/index.ts';
import assert from 'assert';

describe('Defers & pointers', () => {
	it('Defers values', () => {
		const struct = new Struct(ctx => {
			const double = ctx.defer(1);
			const single = ctx.u8('single');
			double.u8(Literal(single * 2));
		});

		const source_unpacked = { single: 3 };
		const source_packed = new Uint8Array([6, 3]);

		const packed = new Uint8Array(2);
		const unpacked = {};

		struct.pack(source_unpacked, packed.buffer);
		assert.deepStrictEqual(packed, source_packed);

		struct.unpack(source_packed.buffer, unpacked);
		assert.deepStrictEqual(unpacked, source_unpacked);
	});

	it('Defers pointed data', () => {
		const source_packed = new Uint8Array([
			0x41, 0x08, 0x00, 0x58, 0x0B, 0x00, 0x00, 0x00, 0x42, 0x00, 0x10, 0x59,
			0x00, 0x00, 0x00, 0x11, 0x43, 0x5A
		]);

		const struct = new Struct(ctx => {
			ctx.order('LE');
			ctx.str(Literal('A'), 1); // #1
			ctx.pointer('i16')(ptr1 => {
				ptr1.order('BE');
				ptr1.str(Literal('B'), 1); // #3
				ptr1.pointer('i16')(ptr2 => {
					ptr2.str(Literal('C'), 1); // #5
				});
			});

			ctx.order('LE');
			ctx.str(Literal('X'), 1); // #2
			ctx.pointer('i32')(ptr1 => {
				ptr1.order('BE');
				ptr1.str(Literal('Y'), 1); // #4
				ptr1.pointer('i32')(ptr2 => {
					ptr2.str(Literal('Z'), 1); // #6
				});
			});
		});

		const packed = new Uint8Array(struct.length({}));
		struct.pack({}, packed.buffer);
		assert.deepStrictEqual(packed, source_packed);
		struct.unpack(packed.buffer, {});
	});

	it('Offsets pointers within substructs', () => {
		const source_packed = new Uint8Array([
			0x62, 0x61, 0x73, 0x65, 0x00, 0x08, 0x00, 0x0F, 0x73, 0x75, 0x62, 0x00,
			0x0E, 0x00, 0x17, 0x73, 0x75, 0x62, 0x00, 0x09, 0x00, 0x19, 0x41, 0x42,
			0x41, 0x42
		]);
		
		const sub = new Struct(ctx => {
			ctx.str(Literal('sub'), 3);
			ctx.pointer('i16', true)(ptr1 => ptr1.str(Literal('A'), 1));
			ctx.pointer('i16', false)(ptr1 => ptr1.str(Literal('B'), 1));
		});

		const base = new Struct(ctx => {
			ctx.str(Literal('base'), 4);
			ctx.pointer('i16', true)(ptr1 => ptr1.struct(sub, Literal({})));
			ctx.pointer('i16', false)(ptr1 => ptr1.struct(sub, Literal({})));
		});

		const packed = new Uint8Array(base.length({}));
		base.pack({}, packed.buffer);
		assert.deepStrictEqual(packed, source_packed);
		base.unpack(packed.buffer, {});
		// console.log(Array.from(packed).map(x => '0x'+x.toString(16)).join(', '));

	})
});