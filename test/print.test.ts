import { Struct, Literal } from '../src/index.ts';
import assert from 'assert';

describe('Debug printing', () => {
	it('Literals', () => {
		assert.strictEqual(Literal(null).toString(),        'Literal<null>');
		assert.strictEqual(Literal('ABC').toString(),       'Literal<"ABC">');
		assert.strictEqual(Literal(123).toString(),         'Literal<123>');
		assert.strictEqual(Literal(new Array()).toString(), 'Literal<Array>');
	});

	it('Structs', () => {
		assert.throws(() => {
			new Struct(ptr => ptr.u32('bad')).pack({}, new Uint8Array(4).buffer);
		}, { message: 'Struct: Expected type number for key bad, but got undefined instead!' });
		
		assert.throws(() => {
			new Struct(ptr => ptr.u32('bad'), { name: 'Test' }).pack({}, new Uint8Array(4).buffer);
		}, { message: 'Test: Expected type number for key bad, but got undefined instead!' });
	});
})