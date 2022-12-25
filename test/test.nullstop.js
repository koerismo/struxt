import { DTYPE as D, Struct, NULLSTOP } from '../dist/index.js';
import { deepStrictEqual, strictEqual } from 'assert';

it( 'Creates a new Struct object containing null-terminated values' , done => {

const st = new Struct([
	{ magic: 'IDENT', type: D.STR, size: 5 },
	{ name: 'v1', type: D.STR, size: NULLSTOP },
	{ name: 'v2', type: D.FLOAT32, size: NULLSTOP },
	{ name: 'v3', group: new Struct([
		{ magic: 0xff, type: D.UINT8 },
		{ name: 'v4', type: D.INT32, size: 4 },
	]), size: NULLSTOP },
]);

const input = {
	'v1': 'ABCDE',
	'v2': new Float32Array([10.1, 128.12801, 25.6]),
	'v3': [
		{ 'v4': new Int32Array([ 10, 20, 30, 40 ]) },
		{ 'v4': new Int32Array([ 50, 60, 70, 80 ]) },
	]
}

const packed = st.pack(input);
const unpacked = st.unpack(packed);
deepStrictEqual( unpacked, input );

done();
});