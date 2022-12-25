import { DTYPE as D, Struct, NULLSTOP, SINGLE } from '../dist/index.js';
import { deepStrictEqual, doesNotThrow, strictEqual, throws } from 'assert';

const goodArgs = [
	{ name: 0, type: D.INT16 },
	{ name: null, type: D.INT8, size: SINGLE },
	{ name: '', type: D.UINT64, size: 1 },
	{ name: 'test', size: ()=>{}, type: D.PADDING },
	{ name: 'test', size: 4, type: ()=>{}, group: ()=>{} },
	{ type: D.PADDING, size: 10 },
	{ magic: null, type: D.NULL },
	{ magic: 'sus', type: D.STR },
];

const badArgs = [
	{ name: undefined, type: D.INT16 },
	{ name: 'test', type: D.INT32, group: new Struct() },
	{ name: 'test', type: null, group: null },
	{ type: D.FLOAT32 },
	{ magic: 'bad value', type: D.INT32 },
];

const strGoodArgs = [
	'',
	'i',
	'3x',
	'>b<10b=s',
	'2[2s]',
	'<f>[sc]',
];

it( 'Tests valid argument options for the add() function', done => {
	try {
		const st = new Struct();
		for ( let arg of goodArgs ) {
			doesNotThrow( ()=>st.add(arg) );
		}
		done();
	} catch(e) {
		done(e)
	}
});

it( 'Tests invalid argument options for the add() function', done => {
	try {
		const st = new Struct();
		for ( let arg of badArgs ) {
			throws( ()=>st.add(arg) );
		}
		done();
	} catch(e) {
		done(e)
	}
});

it( 'Tests valid string constructors for the Struct initializer', done => {
	try {
		for ( let arg of strGoodArgs ) {
			doesNotThrow( ()=>new Struct(arg) );
		}
		done();
	} catch(e) {
		done(e)
	}
});