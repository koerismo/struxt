import { DTYPE as D, Struct, NULLSTOP, SINGLE } from '../dist/index.js';
import { deepStrictEqual, strictEqual, throws } from 'assert';

it( 'Creates and tests invalid/valid substructs', done => {

function make_subsub( size ) {
	return new Struct([
		{ name: 'group1', group: new Struct([
			{ name: 'value1', type: D.INT32, size: 3 }
		]), size: size }
	]);
}

const stA = make_subsub( SINGLE );
const stB = make_subsub( 2 );
const stC = make_subsub( NULLSTOP );
const stD = make_subsub( self => { return 3 } );

const inpA = {
	group1: { value1: new Int32Array([1, 2, 3]) },
}, inpB = {
	group1: [
		{ value1: new Int32Array([1, 2, 3]) },
		{ value1: new Int32Array([4, 5, 6]) },
	]
}, inpC = {
	group1: [
		{ value1: new Int32Array([1, 2, 3]) },
		{ value1: new Int32Array([2, 4, 6]) },
		{ value1: new Int32Array([3, 6, 9]) },
		{ value1: new Int32Array([4, 8,12]) },
	]
}, inpD = {
	group1: [
		{ value1: new Int32Array([1, 2, 3]) },
		{ value1: new Int32Array([4, 5, 6]) },
		{ value1: new Int32Array([7, 8, 9]) },
	],
}, badX = {
}, badY = {
	group1: 'bad value!',
}, badZ = {
	group1: [ 1, 2, 3 ]
};

const upacA = stA.unpack(stA.pack(inpA));
const upacB = stB.unpack(stB.pack(inpB));
const upacC = stC.unpack(stC.pack(inpC));
const upacD = stD.unpack(stD.pack(inpD));

deepStrictEqual( upacA, inpA );
deepStrictEqual( upacB, inpB );
deepStrictEqual( upacC, inpC );
deepStrictEqual( upacD, inpD );

throws( ()=>stA.pack(badX) );
throws( ()=>stA.pack(badY) );
throws( ()=>stA.pack(badZ) );

throws( ()=>stB.pack(badX) );
throws( ()=>stB.pack(badY) );
throws( ()=>stB.pack(badZ) );

done();
});