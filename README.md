# struct.ts
A javascript-typescript library for Python-style data structures.


## Descriptions
A structure features two component types: Tokens and groups. The latter is where this library deviates from Python's `struct` module.

**Tokens** handle the data being packed and unpacked by the structure. A token consists of a data type and a length. These two attributes are defined in the structure by a number and a single character. The token objects are auto-created by the structure object on initialization.

**Groups** allow you to group tokens together. A group consists of a series of tokens and a length. These attributes are defined in the structure by a number and a series of tokens surrounded by brackets. struct.ts features two types of groups: sticky groups and separating groups. The primary difference between the two is that sticky groups take a single slot to pack and unpack, that single slot being an array of the collapsed values. Sticky groups are defined in the structure with square brackets `[]`, whereas separating groups are defined with round brackets `()`.

## Replacements
struct.ts also allows structs to have other structs defined within the structure. Replacements are evaluated during structure object construction, meaning that their contents are copied into a new group inside the struct. They can be defiend by inserting a name in *fancy* brackets `{}`, and inserting an entry with a matching name into a dict, which must be supplied to the constructor as an additional argument.

# Examples
```ts
/* Simple pack and unpack. */
const ExampleA  = new JStruct( "iiii" );          // Create a new struct.
const packedA   = ExampleA.pack([ 1, 2, 3, 4 ]);  // Pack the specified data into a new Uint8Array
const unpackedA = ExampleA.unpack( packedA );     // Unpack the Uint8Array back into the original format
console.log( unpackedA );
```
```ts
/* Pack a couple of strings with groups. */
const ExampleB = new JStruct( "2(5s)" );               // Create a struct with two 5-letter strings
const packedB  = ExampleB.pack([ "Hello", "World" ]);  // Pack our two strings into a Uint8Array
console.log( packedB );
```
```ts
/* Use sticky groups to smartly unpack data. */
const ExampleC  = new JStruct( "4[2c]" );                // Create a struct of four two-char sticky groups
const unpackedC = ExampleC.unpack([ 1,2,3,4,5,6,7,8 ]);  // Unpack some data.
console.log( unpackedC );
```
```ts
/* Use replacements to insert a struct within another struct */
const Color    = new JStruct( "4c8s" );                        // Create a struct containing 3 chars and an 8-letter name
const Palette  = new JStruct( "3{color}", {'color': Color} );  // Create another struct containing 3 copies of the first one
const packedPalette = Palette.pack([                           // Pack some data
	0,   0,   0,   0,   'None',
	0,   0,   0,   255, 'Black',
	255, 255, 255, 255, 'White',
]);
console.log( packedPalette );
```
