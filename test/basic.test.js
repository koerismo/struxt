import { Struct, Literal } from '../dist/index.js';

it('Creates a new struct', () => {

const struct = new Struct(buf => {
	const buf2 = buf.defer(2);

	buf.u8('test_1');
	buf.u8('test_2', 4);
	buf.u8('test_3', '\xff');

	buf2.u8(Literal([64, 128]), 2);
});

const buf = new ArrayBuffer(20);

console.log(struct.pack_into({
	test_1: 10,
	test_2: [1,2,3,4],
	test_3: [10,20,30,40,50,60]
}, buf));

console.log(new Uint8Array(buf));

const data = {};
console.log(struct.unpack_into(data, buf));
console.log(data);
})