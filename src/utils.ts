/** Represents a literal value in the data structure. */
export class Literal<T> {
	value: T;

	constructor(value: T) {
		this.value = value;
	}
}

/** Constructs a new Literal. */
export function toLiteral<T>(value: T): Literal<T> {
	return new Literal(value);
}

export type Key<T> = Literal<T>|string;
export type Length<Key> = Key extends null ? number : number|string;
export type Arr<T> = ArrayLike<T>;
export type numbers = Arr<number>;

export function untilTerminator(view: DataView, pointer: number, terminator: number, increment: number) {
	const buffer_length = view.byteLength - view.byteOffset;
	let i = pointer;
	while ( i < buffer_length ) {
		if ( view.getUint8(i) == terminator ) break;
		i += increment;
	}
	return i;
}

export function isArrayLike(object: unknown): object is ArrayLike<any> {
	if (typeof object !== 'object' || object == null) return false;
	if (Array.isArray(object)) return true;
	if ('length' in object) return true;
	return false;
}