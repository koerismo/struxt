import { JToken, JTokenList } from './jstruct_tokens.js';


/* JInternalStruct: A class to handle sub-structs and struct groups. Do not create manually! */
class JInternalStruct {

	size: number = 1;
	type: number = JStruct.GROUP;
	order: boolean = JStruct.BIG;

	struct: Array<JToken|JInternalStruct> = [];
	parent: JStruct|JInternalStruct|null;
	constructor( size: number, parent: JStruct|JInternalStruct|null, type: number, little: boolean ) {
		this.size = size;
		this.type = type;
		this.order = little;
		this.parent = parent;
	}

	// Calculate the number of inputs necessary to pass to this struct to fill it in
	calculate_unpacked_length(): number {
		if ( this.type === JStruct.ARRAY ) { return this.size }

		let sum = 0;
		for ( let tok of this.struct ) {
			if ( tok instanceof JInternalStruct ) { sum += tok.calculate_unpacked_length(); continue }
			if ( tok.constructor.conjoined )	{ sum += 1 }
			else								{ sum += tok.size }
		}
		return sum * this.size;
	}

	// Calculate the length of this struct's data when packed, in bytes.
	calculate_packed_length(): number {

		let sum = 0;
		for ( let tok of this.struct ) {
			if ( tok instanceof JInternalStruct ) { sum += tok.calculate_packed_length() }
			else { sum += tok.size * tok.constructor.bytes }
		}

		return this.size * sum;
	}

	// Print a debug string of this struct's contents
	print() {
		let out = `(${this.size}x) Struct`;
		for ( let tok of this.struct ) {
			out += '\n| ' + tok.print().split('\n').join('\n| ');
		}

		return out;
	}

	pack_old( data: Array<any>, little: boolean = false ): Uint8Array {

		const in_length = this.calculate_unpacked_length();
		if ( data.length !== in_length ) {throw(`Expected array of length ${in_length}, received ${data.length}!`)}

		let pointer_in = 0;
		let pointer_out = 0;
		const out = new Uint8Array( this.calculate_packed_length() );

		for ( let tok of this.struct ) {
			if ( tok instanceof JInternalStruct ) {
				continue;
			}

			const token_size_in = tok.constructor.conjoined ? 1 : tok.size;
			const data_slice = data.slice( pointer_in, pointer_in + token_size_in );

			if (tok.constructor.conjoined && data_slice[0].length !== tok.size ) {
				throw(`Conjoined token expected entry of length ${tok.size}, but received length ${data_slice[0].length}!`);
			}

			const out_chunk = tok.pack( data_slice, little );
			for ( let i=0; i<out_chunk.length; i++ ) { out[i+pointer_out] = out_chunk[i] }

			pointer_in += token_size_in;
			pointer_out += tok.size * tok.constructor.bytes;
		}
		
		return out;
	}

	// Transform an array of inputs into packed data.
	pack( data: Array<any> ): Uint8Array {

		const length_in  = this.calculate_unpacked_length();
		const length_out = this.calculate_packed_length();
		if (data.length !== length_in) {throw(`Expected array of length ${length_in}, but received ${data.length}!`)}
		const self_is_array = this.type === JStruct.ARRAY;

		const output = new Uint8Array(length_out);

		let pointer_in  = 0;
		let pointer_out = 0;
		for ( let token of this.struct ) {
			if ( token instanceof JInternalStruct ) {



			} else {

				if ( token.constructor.conjoined ) {
					const token_data = data[pointer];
					const chunk = token.unpack( token_data );
					pointer ++;
				}

			}
		}
	}

	// Transform packed data into an array of outputs
	unpack( data: Uint8Array ): Array<any> {

		const length_in  = this.calculate_packed_length();
		const length_out = this.calculate_unpacked_length();
		if ( data.length !== length_in ) {throw(`Expected array of length ${length_in}, but received ${data.length}!`)}
		const self_is_array = this.type === JStruct.ARRAY;

		const unified_length = self_is_array ? this.size : length_out;
		const unified = new Array( unified_length );
		let pointer_unified = 0;

		let pointer_in = 0;
		for ( let l=0; l<this.size; l++ ) {

			const output = new Array( Math.round(length_out / this.size) ); 
			let pointer_out = 0;

			for ( let token of this.struct ) {
				if ( token instanceof JInternalStruct ) {

					const consumes = token.calculate_packed_length();
					const token_data = data.slice( pointer_in, pointer_in+consumes );
					pointer_in += consumes;

					const token_return = token.unpack( token_data );
					const token_is_array = token.type === JStruct.ARRAY;

					for ( let i=0; i<token_return.length; i++ ) { output[pointer_out+i] = token_return[i] }
					pointer_out += token_return.length;

				}
				else {

					const consumes = token.size * token.constructor.bytes;
					const token_data = data.slice( pointer_in, pointer_in+consumes );
					pointer_in += consumes;

					const token_return = token.unpack( token_data );

					if ( token.constructor.conjoined ) {
						output[pointer_out] = token_return;
						pointer_out += 1;
					}
					else {
						for ( let i=0; i<token_return.length; i++ ) { output[pointer_out+i] = token_return[i] }
						pointer_out += token_return.length;
					}

				}
			}

			if ( self_is_array ) {
				unified[pointer_unified] = output;
				pointer_unified += 1;
			}
			else {
				for ( let i=0; i<output.length; i++ ) { unified[pointer_unified+i] = output[i] }
				pointer_unified += output.length;
			}
			
		}

		// Should return [[set1][set2][set3]] if array, otherwise
		// should return [set1set2set3]
		return unified;
	}
}

/* JStruct: A class to handle structs. */
export class JStruct extends JInternalStruct {

	static GROUP	= 0;
	static ARRAY	= 1;

	static LITTLE	= true;
	static BIG		= false;

	constructor( struct: string ) {
		super( 1, null, JStruct.GROUP, JStruct.BIG );

		const arr = struct.split('');
		let active_size: number|null = null;
		let active_struct: JStruct|JInternalStruct = this;
		let active_order: boolean = this.order;

		for (let tok of arr) {

			// Count size
			if ( '0123456789'.includes(tok) ) {
				if ( active_size === null ) {
					active_size = Number(tok);
				} else {
					active_size *= 10;
					active_size += Number(tok);
				}
				continue;
			}

			// Enter substruct
			if ( tok === '(' || tok === '[' ) {
				const token_size	= active_size === null ? 1 : active_size;
				const bracket_type	= tok === '(' ? JStruct.GROUP : JStruct.ARRAY;
				const parent_struct	= active_struct;

				active_struct = new JInternalStruct( token_size, parent_struct, bracket_type, active_order );
				parent_struct.struct.push( active_struct );
				active_size = null;
				continue;
			}

			// Exit substruct
			if ( tok === ')' || tok === ']' ) {
				if ( active_struct.parent === null ) { throw('ParseError: Encountered extra end bracket!') }

				const bracket_type = tok === ')' ? JStruct.GROUP : JStruct.ARRAY;
				if ( bracket_type !== active_struct.type ) { throw(`ParseError: Encountered non-matching bracket ${tok}`) }
				
				active_struct = active_struct.parent;
				continue;
			}

			// Set endianness
			if ( tok === '<' ) { active_order = JStruct.LITTLE;	continue }
			if ( tok === '>' ) { active_order = JStruct.BIG;	continue }

			// Create single token
			if ( tok in JTokenList ) {
				const token_size = active_size === null ? 1 : active_size;
				active_struct.struct.push( new (JTokenList[tok])(token_size, active_order) );
				active_size = null;
				continue;
			}

			// If none of the above match, character must be illegal.
			throw(`ParseError: Unrecognized token ${tok}`);
		}
	}

	print() {
		let out = '';
		for ( let tok of this.struct ) {
			out += tok.print() + '\n';
		}
		return out;
	}
}