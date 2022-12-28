import { DTYPE as D, Struct, NULLSTOP, SINGLE } from '../dist/index.js';
import { deepStrictEqual, doesNotThrow, equal, strictEqual, throws } from 'assert';

function runtest( strc, inps, sizes ) {
	const st = new Struct(strc);
	for ( let i=0; i<inps.length; i++ ) {
		const packed = st.pack( inps[i] );
		equal( packed.length, sizes[i] );

		const unpacked = st.unpack( packed );
		deepStrictEqual( unpacked, inps[i] );
	}
}

function runcrashtest( strc, inps ) {
	const st = new Struct(strc);
	for ( let i=0; i<inps.length; i++ ) {
		throws( ()=>st.pack(inps[i]) );
	}
}

it( 'Tests valid struct evaluators', done => {

/* Modular type */

runtest([
	{ name: 'a', type: D.UINT8 },
	{ name: 'b', type: ctx => ctx.get('a') }
], [
	{ a: D.UINT8, b: 0xff },
	{ a: D.FLOAT64, b: 123.456789 }
], [2, 9]);

/* Modular size */

runtest([
	{ name: 'a', type: D.UINT8 },
	{ name: 'b', type: D.STR, size: ctx => ctx.get('a') }
], [
	{ a: 3, b: 'xyz' },
	{ a: 4, b: 'abcd' }
], [4, 5]);

/* Modular group */

runtest([
	{ name: 'a', type: D.BOOL },
	{ name: 'b', type: ctx => ctx.get('a') ? null:D.UINT8, group: ctx => ctx.get('a') ? new Struct():null }
], [
	{ a: false, b: 123 },
	{ a: true, b: {} },
], [2, 1]);

/* Parent context reference */

runtest([
	{ name: 'a', type: D.BOOL },
	{ name: 'b', group: new Struct([
		{ name: 'c', type: ctx => ctx.parent.get('a') ? D.INT8 : D.FLOAT64 }
	]) }
], [
	{ a: true, b: { c: 123 } },
	{ a: false, b: { c: 456.789 } },
], [2, 9]);

done();
});


it( 'Tests invalid struct evaluators', done => {

/* Fail case: size */

runcrashtest([
	{ name: 'a', type: D.UINT8 },
	{ name: 'b', type: D.STR, size: ctx => null }
], [
	{ a: 3, b: '' },
	{ a: 4, b: '' }
]);

/* Fail case: Modular group */

runcrashtest([
	{ name: 'a', type: D.BOOL },
	{ name: 'b', type: ctx => ctx.get('a'), group: ctx => ctx.get('a') }
], [
	{ a: false },
	{ a: true }
]);

done();
});