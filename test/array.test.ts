import { Struct, Literal } from '../src/index.ts';
import assert from 'assert';

const input = {
	items_u8:  new Uint8Array([100, 200, 300, 400]),
	items_u16: new Uint16Array([1000, 2000, 3000, 4000]),
	items_u32: new Uint32Array([10000, 20000, 30000, 40000]),
	
	items_i8:  new Int8Array([-100, -200, -300, -400]),
	items_i16: new Int16Array([-1000, -2000, -3000, -4000]),
	items_i32: new Int32Array([-10000, -20000, -30000, -40000]),
	
	items_f16:  new Float16Array([123.456, 789.012, 345.678, 901.234]),
	items_f32:  new Float32Array([123.456, 789.012, 345.678, 901.234]),
	
	items_f64: new Float64Array([123.456, 789.012, 345.678, 901.234]),
	items_u64: new BigUint64Array([10000000n, 20000000n, 30000000n, 40000000n]),
	items_i64: new BigInt64Array([-10000000n, -20000000n, -30000000n, -40000000n]),
};

const packed_length = (1 + 2 + 4 + 1 + 2 + 4 + 2 + 4 + 8 + 8 + 8) * 4;

function runStructTests(endian: boolean) {
	const packed = new Uint8Array(packed_length);
	const struct = new Struct((ctx, order) => {
		ctx.order(order);
		const kinds = [ctx.u8, ctx.u16, ctx.u32, ctx.i8, ctx.i16, ctx.i32, ctx.f16, ctx.f32, ctx.f64, ctx.u64, ctx.i64];
		for (const kind of kinds) {
			kind.bind(ctx)(`items_${kind.name}`, 4);
		}
	});

	it('Length Mode', () => {
		let length!: number;
		assert.doesNotThrow(() => {length = struct.length(input, [endian])});
		assert.strictEqual(length, packed_length);
	});

	it('Pack Mode', () => {
		let ptr!: number;
		assert.doesNotThrow(() => {ptr = struct.pack(input, packed.buffer, [endian])});
		assert.strictEqual(ptr, packed_length);
	});

	it('Unpack Mode', () => {
		let ptr!: number;
		let unpacked = {};
		assert.doesNotThrow(() => {ptr = struct.unpack(packed.buffer, unpacked, [endian])});
		assert.strictEqual(ptr, packed_length);
		assert.deepStrictEqual(unpacked, input);
	});
}

describe('Array Tests (LE)', () => {
	runStructTests(true);
});

describe('Array Tests (BE)', () => {
	runStructTests(false);
});
