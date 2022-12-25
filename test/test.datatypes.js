import { DTYPE as D, Struct, SINGLE } from '../dist/index.js';
import Tap from 'tap';

const data_types = [
	D.INT8,
	D.UINT8,
	D.INT16,
	D.UINT16,
	D.INT32,
	D.UINT32,
	D.FLOAT32,
	D.FLOAT64,
	D.CHAR,
	D.STR,
	D.BOOL,
	D.PADDING,
	D.NULL,
];

const data_accepts_input = [
	true, true,
	true, true,
	true, true,
	true, true,
	true,
	true,
	true,
	false,
	true,
];

const data_inputs = [
	[ new Int8Array([-128,-128]), -128 ],
	[ new Uint8Array([255,255]), 255 ],
	[ new Int16Array([-32768,-32768]), -32768 ],
	[ new Uint16Array([65535,65535]), 65535 ],
	[ new Int32Array([-2147483648,-2147483648]), -2147483648 ],
	[ new Uint32Array([4294967295,4294967295]), 4294967295 ],
	[ new Float32Array([123.456787109375,123.456787109375]), 123.456787109375 ],
	[ new Float64Array([123.456789,123.456789]), 123.456789 ],
	[ new Uint8Array([1,2,3,4]), 1 ],
	[ 'abcdef', 'a' ],
	[ [true, false], true ],
	[ [null, null, null], null ], // Padding: this data will be ignored.
	[ [null, null, null], null ],
];

console.log('Constructing...');
const st = new Struct();

st.add({
	magic: 123,
	type: D.UINT8,
	size: SINGLE,
});
st.add({
	magic: new Uint8Array([123, 456]),
	type: D.UINT8,
	size: 2,
});

for ( let i=0; i<data_types.length; i++ ) {
	const dt = data_types[i];
	st.add({
		name: i+'_A',
		type: dt,
		size: data_inputs[i][0].length,
		endian: !!(i%2),
	});
	st.add({
		name: i+'_B',
		type: dt,
		size: SINGLE,
		endian: !(i%2),
	});
}

const input = {};
for ( let i=0; i<data_types.length; i++ ) {
	if (data_accepts_input[i]) {
		input[i+'_A'] = data_inputs[i][0];
		input[i+'_B'] = data_inputs[i][1];
	}
}

console.log('\nPacking...');
const packed = st.pack(input);

console.log('\nUnpacking...');
const unpacked = st.unpack(packed);

Tap.strictSame( unpacked, input );
Tap.end();
