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
			if ( tok.constructor.only_packed )	{ continue }
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
			else { sum += tok.size * tok.constructor.bytes * !tok.constructor.only_unpacked }
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

	// Transform an array of inputs into packed data.
	pack( data: Array<any> ): Uint8Array {

		const length_in  = this.calculate_unpacked_length();
		const length_out = this.calculate_packed_length();
		if (data.length !== length_in) {throw( `Expected array of length ${length_in}, but received ${data.length}!` )}
		const self_is_array = this.type === JStruct.ARRAY;

		const output = new Uint8Array(length_out);
		function push( arr: Uint8Array ) {
			if ( pointer_out + arr.length > length_out ) {throw( `Reached output boundary at ${length_out}! Attempted to write at ${pointer_out+arr.length}` )}
			for (let i=0; i<arr.length; i++ ) { output[pointer_out+i] = arr[i] }
			pointer_out += arr.length;
		}

		let pointer_in  = 0;
		let pointer_out = 0;

		// Consume data for each "copy" of this substruct.
		// If it is an array-type substruct, unpacked data will be provided as an array of arrays.
		let subdata = data;
		for ( let l=0; l<this.size; l++ ) {
			if ( self_is_array ) { subdata = data[l]; pointer_in = 0 }

			for ( let token of this.struct ) {
				if ( token instanceof JInternalStruct ) {

					if ( token.type === JStruct.ARRAY ) {
						const token_data = subdata.slice( pointer_in, pointer_in+token.size );
						const chunk = token.pack( token_data );
						pointer_in += token.size;
						push( chunk );
					}
					else {
						const token_data = subdata.slice( pointer_in, pointer_in+token.calculate_unpacked_length() );
						const chunk = token.pack( token_data );
						pointer_in += token.size;
						push( chunk );
					}

				} else {

					if ( token.constructor.only_unpacked ) {
						pointer_in += token.size;
						continue;
					}

					if ( token.constructor.only_packed ) {
						push( token.pack(null) );
						continue;
					}

					if ( token.constructor.conjoined ) {
						const token_data = subdata[pointer_in];
						const chunk = token.pack( token_data );
						pointer_in ++;
						push( chunk );
					}
					else {
						const token_data = subdata.slice( pointer_in, pointer_in+token.size );
						const chunk = token.pack( token_data );
						pointer_in += token.size;
						push( chunk );
					}

				}
			}
		}

		return output;
	}

	// Transform packed data into an array of outputs
	unpack( data: Uint8Array ): Array<any> {

		if (!(data instanceof Uint8Array)) {throw( `Expected Uint8Array, received ${data.constructor.name}!` )}

		const length_in  = this.calculate_packed_length();
		const length_out = this.calculate_unpacked_length();
		if ( data.length !== length_in ) {throw( `Expected array of length ${length_in}, but received ${data.length}!` )}
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

					if ( token.constructor.only_unpacked ) {
						const token_return = token.unpack( null );
						for ( let i=0; i<token_return.length; i++ ) { output[pointer_out+i] = token_return[i] }
						pointer_out += token_return.length;
						continue;
					}

					if ( token.constructor.only_packed ) {
						pointer_in += token.size * token.constructor.bytes;
						continue;
					}

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

		return unified;
	}
}

/* JStruct: A class to handle structs. */
export class JStruct extends JInternalStruct {

	static GROUP	= 0;
	static ARRAY	= 1;

	static LITTLE	= true;
	static BIG		= false;

	constructor( struct: string, variables: object = {} ) {
		super( 1, null, JStruct.GROUP, JStruct.BIG );

		const arr = struct.split('');
		let active_size: number|null = null;
		let active_struct: JStruct|JInternalStruct = this;
		let active_order: boolean = this.order;
		let active_variable: string|null = null;

		for (let tok of arr) {

			// Enter variable
			if ( tok === '{' ) { active_variable = ''; continue }

			// Exit variable
			if ( tok === '}' ) {
				if ( active_variable === null )							{throw( 'ParseError: Encountered extra end bracket!' )}
				if (!( active_variable in variables ))					{throw( `ParseError: Attempted to insert nonexistent substruct ${active_variable}` )}
				if (!( variables[active_variable] instanceof JStruct ))	{throw( 'ParseError: Substructs must be instances of JStruct!' )}

				const token_size	= active_size === null ? 1 : active_size;
				const substruct = new JInternalStruct( token_size, active_struct, JStruct.GROUP, active_order );

				for ( let subtoken of variables[active_variable].struct ) { substruct.struct.push(subtoken) }
				active_struct.struct.push( substruct );
				
				active_variable = null;
				continue;
			}

			// Add token to variable
			if ( active_variable !== null ) { active_variable += tok; continue }


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
				if ( JTokenList[tok] === null ) { continue; }
				const token_size = active_size === null ? 1 : active_size;
				active_struct.struct.push( new (JTokenList[tok])(token_size, active_order) );
				active_size = null;
				continue;
			}

			// If none of the above match, character must be illegal.
			throw(`ParseError: Unrecognized token "${tok}"`);
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