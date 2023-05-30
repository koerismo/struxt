# Struxt
Struxt is a portable zero-dependency library that abstracts binary packing/unpacking into reusable structures.

## An Introduction
Rewritten from the ground up, struxt v3 allows developers to define data structures on-the-fly with Javascript code. This iteration features an api inspired by `smart-buffer` which allows data to be packed and unpacked via pointer methods.

## Examples
```js
import { Struct, Literal } from 'struxt';

const PlayerData = new Struct(ptr => {
	// allocate 1 byte of data to a new pointer
	const len_ptr = ptr.defer(1);

	// write some data
	ptr.f32('position', 3);
	ptr.f32('rotation', 3);
	ptr.u8('health');
	ptr.str('name', '\0');

	// write the chunk length to the allocated byte as a uint8
	len_ptr.u8(Literal( ptr.position() ));
});
```