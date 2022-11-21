# `construc.ts`
### *Dynamic binary structures for Javascript*

# Overview

Construc.ts is a library for packing and unpacking binary data structures in javascript.

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


# Examples

## String-based struct creation
```js
import { Struct } from './dynstruct.js';

var myStruct = new Struct('4i2?[I]');
var data = myStruct.pack([
	[1, 2, 3, 4],
	[true, false],
	[1234],
]);
console.log(myStruct.unpack(data));
// { 0: [1, 2, 3, 4], 1: [true, false], 2: { 0: 1234 } }
```

## Functional struct creation
```js
import { Struct } from './dynstruct.js';
import { DTYPE } from './datatype.js';

var mySubstruct = new Struct();
mySubstruct.add({ name: 'value', type: DTYPE.UINT32 });

var myStruct = new Struct();
myStruct.add({ name: 'a', type: DTYPE.INT32, size: 4 });
myStruct.add({ name: 'b', type: DTYPE.BOOL, size: 2 });
myStruct.add({ name: 'c', group: mySubstruct });

var data = myStruct.pack({
	a: [1, 2, 3, 4],
	b: [true, false],
	c: { value: 1234 },
});

console.log(myStruct.unpack(data));
// { a: [1, 2, 3, 4], b: [true, false], c: { value: 1234 } }
```

## Dynamic struct creation
```js
import { Struct } from './dynstruct.js';
import { DTYPE } from './datatype.js';

var myStruct = new Struct();
myStruct.add({ name: 'str-length', type: DTYPE.UINT16 });
myStruct.add({ name: 'str', type: DTYPE.STR, size: () => myStruct.eval('str-length') });

var data = myStruct.pack({ 'str-length': 5, 'str': 'hello' });
console.log(myStruct.unpack(data));
// { str-length: 5, str: 'hello' }
```