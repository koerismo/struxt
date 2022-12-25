# struxt
### *Low-level dynamic binary data structures for Javascript.*

## Overview
Struxt is a lightweight library for packing and unpacking binary data structures in javascript.

# Examples

## Struct creation
```js
import { Struct, DTYPE as D } from 'struxt';

var myStruct = new Struct([
	{ name: 'a', type: D.INT32, size: 4 },
	{ name: 'b', type: D.BOOL,  size: 2 },
	{ name: 'c', group: new Struct([
		{ name: 'd', type: D.UINT32 }
	]) }
]);

var data = myStruct.pack({
	a: [1, 2, 3, 4],
	b: [true, false],
	c: { d: 1234 },
});

console.log(myStruct.unpack(data));
// { a: [1, 2, 3, 4], b: [true, false], c: { d: 1234 } }
```

## Dynamic structures
```js
import { Struct, DTYPE as D } from 'struxt';

var myStruct = new Struct();
myStruct.add({ name: 'str-length', type: D.UINT16 });
myStruct.add({ name: 'str', type: D.STR, size: () => myStruct.eval('str-length') });

var data = myStruct.pack({ 'str-length': 5, 'str': 'hello' });

console.log(myStruct.unpack(data));
// { str-length: 5, str: 'hello' }
```

## Python-style constructors
```js
import { Struct } from 'struxt';

var myStruct = new Struct('4i2?[I]');
var data = myStruct.pack([
	[1, 2, 3, 4],
	[true, false],
	[1234],
]);

console.log(myStruct.unpack(data));
// { 0: [1, 2, 3, 4], 1: [true, false], 2: { 0: 1234 } }
```


# API Documentation

## Constants
| Constant       | Char | Bytes | Description
|----------------|------|-------|------------
|    `DTYPE.NULL`|  `X` | 0 | Null (Skipped in pack)
| `DTYPE.PADDING`|  `x` | 1 | Padding (Skipped in unpack)
|                |      |   |
|    `DTYPE.BOOL`|  `?` | 1 | Boolean
|    `DTYPE.CHAR`|  `c` | 1 | Char
|     `DTYPE.STR`|  `s` | 1 | String
|                |      |   |
|    `DTYPE.INT8`|  `b` | 1 | Char
|   `DTYPE.UINT8`|  `B` | 1 | Unsigned char
|   `DTYPE.INT16`|  `h` | 2 | Short
|  `DTYPE.UINT16`|  `H` | 2 | Unsigned char
|   `DTYPE.INT32`|  `i` | 4 | Int
|  `DTYPE.UINT32`|  `I` | 4 | Unsigned int
|                |      |   |
| `DTYPE.FLOAT32`|  `f` | 4 | Float
| `DTYPE.FLOAT64`|  `d` | 8 | Double
|                |      |   |
| `SYSTEM_ENDIAN`|  `=` |   | Native system byte order
|    `BIG_ENDIAN`|  `>` |   | Big-endian byte order
| `LITTLE_ENDIAN`|  `<` |   | Little-endian byte order
|                |      |   |
|        `SINGLE`|      |   | Default component size
|      `NULLSTOP`|      |   | Null-terminated component size

## Component Interface
```ts
type ExternalPart = {
    name:    string,
    type?:   int     | ReturnsInt    | ReturnsNull | null,
    group?:  Struct  | ReturnsStruct | ReturnsNull | null,
    size?:   int     | ReturnsInt,
    endian?: boolean,
} | {
    magic:   any,
    type:    int     | ReturnsInt,
    size?:   int     | ReturnsInt,
    endian?: boolean,
} | {
    type:    DTYPE.PADDING,
    size?:   int | ReturnsInt,
};
```

## Struct Constructor
The struct constructor has several methods for inputting structure definitions.

### 1. Character String.
This method was made to closely resemble Python's struct constructors, and takes a string input:

```ts
new Struct(`
	// Comments are supported inside the constructor string
	// for readability, but they may take longer to parse!

	// Endianness markers can be used anywhere in the string.
	// These markers set the "default" endianness for all tokens
	// after it.

	<  // Little-endian marker
	// Everything after this is little-endian

	>  // Big-endian marker
	// Everything after this is big-endian

	f  // Single-letter identifiers are used to insert components.
	5s // Numbers can precede identifiers to set their size.

	[
		2c  // Groups can be defined with a set of square brackets.
		I	// Numbers can also precede groups to set their size.
	]
`);
```
Components created through this method will be assigned ascending numeric names, starting with zero. This allows for arrays to be passed to the pack method as well as objects.

### 2. Full-form Array
The full-form input method not only performs better, but it allows developers to take advantage of the dynamic structure features of this library. (See next section)
```ts
new Struct( Array<ExternalPart> );
```
### 3. Full-form Functional
This method is similar to the above, with the only difference being the usage of the `Struct.add(...)` function to append each component, rather than supplying them through an array.

```ts
myStruct.add( ExternalPart );
```



## Struct Methods

### Struct.**pack**(data: Object): Uint8Array
Packs the values of an object into a buffer via this Struct's layout.

> **Parameters**
>
> `data` The data to pack into the buffer.

### Struct.**unpack**(data: Uint8Array): Object
Unpacks the values from a buffer into an object via this Struct's layout.

> **Parameters**
>
> `data` An array of bytes.

### Struct.**eval**(name: string): any | undefined
Retrieves the value of a component in this Struct.

> **Parameters**
>
> `name` The component to evaluate.
>
> **Returns**
>
> The resulting value, or undefined if the component has not been unpacked yet.

### Struct.**add**(token: ExternalPart): this
Appends a new component to this Struct.

> **Parameters**
>
> `token` The component to append.



## Dynamics
Dynamic structures. This is what makes struxt special! For some parameters (`group`, `type`, and `size`), functions may be passed instead of literal values. These functions are evaluated during the pack/unpack process to determine how the data should be packed or unpacked. This is especially powerful when used in tandem with the `Struct.eval(...)` function, which allows you to access the unpacked values of already-unpacked/packed components.

```ts
const myStruct = new Struct([
	{ name: 'datatype', type: DTYPE.UINT8 },
	{ name: 'data', type: self => self.eval('datatype') },
]);

// As the struct is packing the "datatype" component,
// the value is added to the context. When the data function
// is called, it retrieves that value and encodes "data"
// with the returned type.
myStruct.pack({
	datatype: DTYPE.FLOAT32,
	data: 1.2345,
});

myStruct.pack({
	datatype: DTYPE.STR,
	data: 'X',
});

// Once the struct finishes unpacking the value of "datatype",
// the result is added to the context. When the data function
// is called, it retrieves that value and decodes "data"
// with the returned type.
myStruct.unpack(myData);
```