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

/** Navigates a DataView until a byte matching the terminator is encountered or the buffer ends. */
export function untilTerminator(view: DataView, pointer: number, terminator: number, increment: number) {
	const buffer_length = view.byteLength - view.byteOffset;
	let i = pointer;
	while ( i < buffer_length ) {
		if ( view.getUint8(i) == terminator ) break;
		i += increment;
	}
	return i;
}


export function isArrayLike(object: Object): object is ArrayLike<any> {
	//@ts-ignore
	if (Array.isArray(object)) return true; //@ts-ignore
	if ('length' in object) return true; //@ts-ignore
	return false;
}