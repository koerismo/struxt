# Struxt
Struxt is a lightweight library that abstracts binary packing/unpacking into reusable dynamic structures.

## An Introduction
Rewritten from the ground up, struxt v3 allows developers to define data structures on-the-fly with Javascript code. This iteration features an api inspired by `smart-buffer` which allows data to be packed and unpacked via pointer methods.

## Examples
A basic dynamic structure
```js
import { Struct, Literal } from 'struxt';
import { writeFile } from 'fs/promises';

const Image = new Struct(ptr => {
	const width = ptr.u32('width');
	const height = ptr.u32('height');
	ptr.u8('data', width * height * 4);
});
```
Using strict types with structs
```js
interface Image {
	width: number;
	height: number;
	data: Uint8Array;
}

const Image = new Struct<Image>(ptr => {
	// ...
});
```
Deferred data
```js
const PlayerData = new Struct(ptr => {
	// Allocate 2 bytes of data to a new pointer.
	const length = ptr.defer(2);

	// Handle some data.
	ptr.f32('position', 3);
	ptr.f32('rotation', 3);
	ptr.u8('health');
	ptr.str('name');

	// Add the chunk length to the allocated byte as a uint8.
	length.u16(Literal( ptr.getpos() - 2 ));
});
```
Using the built-in pointers system
```js
// Adapted from the Alien Swarm studiomodel format.
export const mstudiohitboxset_t = new Struct(function(buf) {
	buf.order('LE');

	// Pointers are automatically allocated when packing data.
	buf.pointer('i32')(buf => buf.str('name'));

	const count_hitboxes = buf.i32('count_hitboxes');
	buf.pointer('i32')(buf => buf.struct(mstudiobbox_t, 'hitboxes', count_hitboxes));
});
```
Packing data to a buffer
```ts
const my_image: Image = {
	width: 8, height: 8,
	data: new Uint8Array(64).fill(255)
}

const my_buffer = new ArrayBuffer(Image.length(my_image));
Image.pack(my_image, my_buffer);
writeFile(new Buffer(my_buffer));
```
Unpacking data from a buffer
```ts
const my_image = {}
const my_buffer = new Uint8Array([
	0, 2, 0, 2,
	0, 0, 0, 0,
	0, 0, 0, 0,
	0, 0, 0, 0
	0, 0, 0, 0,
]).buffer;

Image.unpack(my_buffer, my_image);
console.log(my_image);
```