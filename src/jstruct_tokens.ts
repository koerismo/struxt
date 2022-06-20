export const Endian = {
	big:		false,
	little:		true,
}

/* The base class for all token types. */
export class JToken {

	static conjoined: boolean = false;	// Override size and always consume a single slot when packing
	static bytes: number;				// The size of a single token in bytes

	size: number;
	constructor( size: number ) { this.size = size }

	unpack( data: Uint8Array, little: boolean ): any { return }
	pack( data: any, little: boolean ): Uint8Array { return new Uint8Array() }

	print() { return `(${this.size}x) ${this.constructor.name}` }
}

export const JTokenList = {

	/* Char */
	c: class extends JToken {
		static bytes = 1;

		unpack( data: Uint8Array, little: boolean ): Int8Array {
			const view	= new DataView( data.buffer );
			const out	= new Int8Array( data.length );
			for ( let u in data ) { out[u] = view.getInt8(u) }
			return out;
		};
		
		pack( data: Int8Array, little: boolean ) {
			const view	= new DataView(new ArrayBuffer( data.length ));
			for ( let u in data ) { view.setInt8(u, data[u]) }
			return new Uint8Array( view.buffer );
		};
	},


	/* Unsigned Char */
	C: class extends JToken {
		static bytes = 1;

		unpack( data: Uint8Array, little: boolean ): Uint8Array { return new Uint8Array(data) }
		pack( data: Uint8Array, little: boolean ): Uint8Array { return new Uint8Array(data) }
	},


	/* Short */
	h: class extends JToken {
		static bytes = 2;

		unpack( data: Uint8Array, little: boolean ): Int16Array {
			const view	= new DataView( data.buffer );
			const out	= new Int16Array( data.length / 2 );
			for ( let u in out ) { out[u] = view.getInt16(u * 2, little) }
			return out;
		};
		
		pack( data: Int16Array, little: boolean ) {
			const view	= new DataView(new ArrayBuffer( data.length * 2 ));
			for ( let u in data ) { view.setInt16(u * 2, data[u], little) }
			return new Uint8Array( view.buffer );
		};
	},


	/* Unsigned Short */
	H: class extends JToken {
		static bytes = 2;

		unpack( data: Uint8Array, little: boolean ): Int16Array {
			const view	= new DataView( data.buffer );
			const out	= new Int16Array( data.length / 2 );
			for ( let u in out ) { out[u] = view.getUint16(u * 2, little) }
			return out;
		};
		
		pack( data: Int16Array, little: boolean ) {
			const view	= new DataView(new ArrayBuffer( data.length * 2 ));
			for ( let u in data ) { view.setUint16(u * 2, data[u], little) }
			return new Uint8Array( view.buffer );
		};
	},


	/* Int */
	i: class extends JToken {
		static bytes = 4;

		unpack( data: Uint8Array, little: boolean ): Int32Array {
			const view	= new DataView( data.buffer );
			const out	= new Int32Array( data.length / 4 );
			for ( let u in out ) { out[u] = view.getInt32(u * 4, little) }
			return out;
		};
		
		pack( data: Int32Array, little: boolean ) {
			const view	= new DataView(new ArrayBuffer( data.length * 4 ));
			for ( let u in data ) { view.setInt32(u * 4, data[u], little) }
			return new Uint8Array( view.buffer );
		};
	},


	/* Unsigned Int */
	I: class extends JToken {
		static bytes = 4;

		unpack( data: Uint8Array, little: boolean ): Int32Array {
			const view	= new DataView( data.buffer );
			const out	= new Int32Array( data.length / 4 );
			for ( let u in out ) { out[u] = view.getUint32(u * 4, little) }
			return out;
		};
		
		pack( data: Int32Array, little: boolean ) {
			const view	= new DataView(new ArrayBuffer( data.length * 4 ));
			for ( let u in data ) { view.setUint32(u * 4, data[u], little) }
			return new Uint8Array( view.buffer );
		};
	},


	/* Float */
	q: class extends JToken {
		static bytes = 4;

		unpack( data: Uint8Array, little: boolean ): Float32Array {
			const view	= new DataView( data.buffer );
			const out	= new Float32Array( data.length / 4 );
			for ( let u in out ) { out[u] = view.getFloat32(u * 4, little) }
			return out;
		};
		
		pack( data: Float32Array, little: boolean ) {
			const view	= new DataView(new ArrayBuffer( data.length * 4 ));
			for ( let u in data ) { view.setFloat32(u * 4, data[u], little) }
			return new Uint8Array( view.buffer );
		};
	},


	/* String Char[] */
	s: class extends JToken {
		static bytes = 1;
		static conjoined = true;

		unpack( data: Uint8Array, little: boolean ): string {
			return new TextDecoder().decode( data.buffer );
		}
		pack( data: string, little: boolean ): Uint8Array {
			return new TextEncoder().encode( data );
		}
	},
}
