import { Struct } from './struct.js';
import { Literal } from './types.js';

/** Constructs a new Literal. */
export function to_literal<T>(value: T): Literal<T> {
	return new Literal(value);
}

export default Struct;

export {
	Struct,
	to_literal as Literal,
}