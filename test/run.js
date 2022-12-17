const tests = [
	await import('./test.basic.js')
];

console.log('Running tests...');
const mark_start = performance.now();
for ( let i=0; i<tests.length; i++ ) {
	console.log(`Running test ${i+1}/${tests.length} (${tests[i].__name__})`);
	tests[i].default();
}
const mark_end = performance.now();
console.log(`Finished in ${(mark_end-mark_start)}ms!`)