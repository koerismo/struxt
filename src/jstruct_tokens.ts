export const Endian = {
	little:		0,
	big:		1,
}

/* The base class for all token types. */
export class JToken {

	static conjoined: boolean = false;	// Override size and always consume a single slot when packing
	static bytes: number;				// The size of a single token in bytes

	size: number;
	constructor( size: number ) { this.size = size }

	unpack( data: Uint8Array, order: number ): any { return }
	pack( data: any, order: number ): Uint8Array { return new Uint8Array() }

	print() { return `(${this.size}x) ${this.constructor.name}` }
}

export const JTokenList = {

	/* Char: Single-byte int from -128 to 127 */
	c: class extends JToken {
		static bytes = 1;

		unpack( data: Uint8Array, order: number ): Int8Array {
			const view	= new DataView( data.buffer );
			const out	= new Int8Array( data.length );
			for ( let u in data ) { out[u] = view.getInt8(u) }
			return out;
		};
		
		pack( data: Int8Array, order: number ) {
			const view	= new DataView(new ArrayBuffer( data.length ));
			for ( let u in data ) { view.setInt8(u, data[u]) }
			return new Uint8Array( view.buffer );
		};
	},

	/* Unsigned Char: Single-byte int from 0 to 255 */
	C: class extends JToken {
		static bytes = 1;

		unpack( data: Uint8Array, order: number ): Uint8Array { return new Uint8Array(data) }
		pack( data: Uint8Array, order: number ): Uint8Array { return new Uint8Array(data) }
	},

	/* String Char[]: Single-byte int from 0 to 255 */
	s: class extends JToken {
		static bytes = 1;
		static conjoined = true;

		unpack( data: Uint8Array, order: number ): string {
			return new TextDecoder().decode( data.buffer );
		}
		pack( data: string, order: number ): Uint8Array {
			return new TextEncoder().encode( data );
		}
	},

}
