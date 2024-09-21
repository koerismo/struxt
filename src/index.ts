import { Struct } from './struct.js';
import { Literal as LiteralType } from './types.js';

/** Constructs a new Literal. */
function Literal<T>(value: T, assert=true): LiteralType<T> {
	return new LiteralType(value, assert);
}

/**
 * Longhand pointer priority presets. The allocator sorts lower numbers closer to the end of the file!
 * 
 * Note: If a low-priority struct contains a high-priority pointer,
 * the pointer will still be written after its parent!
 * */
export enum Density {
	NONE = 0,
	LOW = 500,
	HIGH = 1000,
}

export default Struct;

export {
	Struct,
	Literal,
	LiteralType
}