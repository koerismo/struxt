import { Struct } from './struct.js';
import { Literal as LiteralType } from './types.js';

/** Constructs a new Literal. */
function Literal<T>(value: T): LiteralType<T> {
	return new LiteralType(value);
}

export default Struct;

export {
	Struct,
	Literal,
	LiteralType
}