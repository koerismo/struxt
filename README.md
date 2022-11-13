# ConstrucTS
*The ultimate binary-packing-unpacking library!*


## So what does it do?
Glad you asked. This library makes it ridiculously easy to read binary data. How you may ask? By letting you mangle data in two steps: defining a binary template, and that's all. How does it work? Please stop asking questions!

This library follows the same conventions as Python's `struct` module, but with the added abilities of including templates in other templates and setting data lengths on the fly.

---

## Okay, just show me the code.
Calm down. Jesus. Here's an example:

```js
var example = Struct.new();
example.add( D.STR, 'identifier', 4 );
example.add( D.UINT8, 'body-length', 1 );
example.add( D.CHAR, 'body', () => example.eval('body-length') );

console.log( example.unpack( myData ) );
/* {
	'identifier': 'ABCD',
	'body-length': 512,
	'body': Uint8Array(512)
} */
```
