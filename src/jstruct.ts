import { JToken, JTokenList } from './jstruct_tokens.js';

export const StructTypes = {
	GROUP:	0,
	ARRAY:	1,
}


/* JInternalStruct: A class to handle sub-structs and struct groups. Do not create manually! */
class JInternalStruct {

	size: number = 1;
	type: number = StructTypes.GROUP;
	struct: Array<JToken|JInternalStruct> = [];
	parent: JStruct|JInternalStruct|null;
	constructor( size: number, parent: JStruct|JInternalStruct|null, type: number ) {
		this.size = size;
		this.type = type;
		this.parent = parent;
	}

	// Calculate the number of inputs necessary to pass to this struct to fill it in
	calculate_parameter_length(): number {
		let sum = 0;
		for ( let tok of this.struct ) {
			if ( tok instanceof JInternalStruct ) { sum += tok.calculate_parameter_length(); continue }
			if ( tok.constructor.conjoined )	{ sum += 1 }
			else								{ sum += tok.size }
		}
		return sum * this.size;
	}

	// Calculate the length of this struct's data when packed, in bytes.
	calculate_length(): number {
		let sum = 0;
		for ( let tok of this.struct ) {
			if ( tok instanceof JInternalStruct ) { sum += tok.calculate_length() }
			else { sum += tok.size * tok.constructor.bytes }
		}

		return this.size * sum;
	}

	print() {
		let out = `(${this.size}x) Struct`;
		for ( let tok of this.struct ) {
			out += '\n| ' + tok.print().split('\n').join('\n| ');
		}

		return out;
	}

	pack( data: Array<any> ): Uint8Array {
		const out = new Uint8Array( this.calculate_length() );
		let pointer = 0;
		for ( let tok of this.struct ) {
			//const chunk = tok.pack()
		}
		return out;
	}

	unpack( data: Uint8Array ): Array<any> {
		return new Array();
	}
}

/* JStruct: A class to handle structs. */
export class JStruct extends JInternalStruct {

	constructor( struct: string ) {
		super( 1, null, StructTypes.GROUP );

		const arr = struct.split('');
		let active_size: number|null = null;
		let active_struct: JStruct|JInternalStruct = this;

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
				const bracket_type	= tok === '(' ? StructTypes.GROUP : StructTypes.ARRAY;
				const parent_struct	= active_struct;

				active_struct = new JInternalStruct( token_size, parent_struct, bracket_type );
				parent_struct.struct.push( active_struct );
				active_size = null;
				continue;
			}

			// Exit substruct
			if ( tok === ')' || tok === ']' ) {
				if ( active_struct.parent === null ) { throw('ParseError: Encountered extra end bracket!') }

				const bracket_type = tok === ')' ? StructTypes.GROUP : StructTypes.ARRAY;
				if ( bracket_type !== active_struct.type ) { throw(`ParseError: Encountered non-matching bracket ${tok}`) }
				
				active_struct = active_struct.parent;
				continue;
			}

			// Create single token
			if ( tok in JTokenList ) {
				const token_size = active_size === null ? 1 : active_size;
				active_struct.struct.push( new (JTokenList[tok])(token_size) );
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