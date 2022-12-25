import { DTYPE, DBYTES, DNARRAY, Pack, Unpack, SINGLE, NULLSTOP, SYSTEM_ENDIAN, DSHORT, LITTLE_ENDIAN, BIG_ENDIAN, VerifyType } from './datatype.js';
import { InternalComponent, Component, SharedStruct, int } from './types.js';

/** Generic error for byte buffer exceptions. */
export function BufferError( msg:string ) {
	this.message	= msg;
	this.name		= 'BufferError';
}

/** Error for malformed Part keys. */
export function KeyError( msg:string ) {
	this.message	= msg;
	this.name		= 'KeyError';
}

/** Error for non-xor component function-value parameter evaluation. */
export function TypeXorError( msg:string ) {
	this.message	= msg;
	this.name		= 'TypeXorError';
}

/** Generic parser error. */
export function ParseError( msg:string ) {
	this.message	= msg;
	this.name		= 'ParseError';
}

/* Complex Struct Class */

export class InternalStruct {
	#parts: InternalComponent[] = [];
	#map: {[key: string]: InternalComponent} = {};
	#context: {}|null = null;

	/**
	 * @param struct See API reference.
	 */
	constructor( struct?:string|Component[] ) {
		const parents = new WeakMap();
		const sizes = new WeakMap();
		const indices = new WeakMap();
		indices.set(this, 0);

		if (!struct) return;
		if (typeof struct === 'string') {
			let last_size: number = SINGLE,
			    last_order = SYSTEM_ENDIAN,
				active_struct: SharedStruct = this,
				in_comment = false;

			for ( let i=0; i<struct.length; i++ ) {
				const char = struct[i];

				// Endianness
				if (char === '<') { last_order = LITTLE_ENDIAN; continue }
				if (char === '>') { last_order = BIG_ENDIAN; continue }
				if (char === '=') { last_order = SYSTEM_ENDIAN; continue }

				// Size
				if ('0123456789'.includes(char)) {
					const _i = parseInt(struct[i]);
					if (last_size === SINGLE) last_size = _i;
					else last_size = last_size*10 + _i;
					continue;
				}

				// Enter subgroup
				if (char === '[') {
					const parent_struct = active_struct;
					active_struct = new InternalStruct();

					sizes.set(active_struct, last_size);
					parents.set(active_struct, parent_struct);
					indices.set(active_struct, 0);
					last_size = SINGLE
					continue;
				}

				// Exit subgroup
				if (char === ']') {
					const parent = parents.get(active_struct);
					const size = sizes.get(active_struct);

					if (size === undefined) throw new ParseError(`Encountered extra end bracket at pos ${i} in struct string!`);
					parent.add({ name:indices.get(parent), group:active_struct, size:size });
					active_struct = parent;
					last_size = SINGLE;
					continue;
				}

				// Comments
				if (char === '/' && struct[i+1] === '/') in_comment = true;
				if (in_comment && char === '\n') in_comment = false;
				if (in_comment) continue;

				// Spacing
				if (char === ' ' || char === '\n' || char === '\r' || char === '\t') continue;

				// Unrecognized character
				if (DSHORT[char] === undefined) throw new ParseError(`Unrecognized struct char ${char} at C${i}!`);

				active_struct.add({ name:indices.get(active_struct), type:DSHORT[char], size:last_size, endian:last_order });
				if (DSHORT[char] !== DTYPE.PADDING) indices.set(active_struct, indices.get(active_struct)+1);

				last_size = SINGLE;
			}
			return;
		}

		for ( let i=0; i<struct.length; i++ ) {
			this.add(struct[i]);
		}
	}

	/**
	 * Retrieves the value of a component in this Struct.
	 * @param name The component to evaluate.
	 * @returns The resulting value, or undefined if the component has not been unpacked yet.
	 */
	eval( name:string ): any|undefined {
		if (!this.#context) throw('Attempted to access Struct context outside of pack/unpack routine!');
		return this.#context[name];
	}

	/**
	 * Appends a new component to this Struct.
	 * @param token The component to append.
	 * @returns this
	 */
	add( token:Component ): ThisType<Struct> {

		let part: InternalComponent = {
			name: undefined,
			magic: undefined,
			type: null,
			group: null,
			size: token.size ?? SINGLE,
			endian: null,
		};

		if ( token.type === DTYPE.PADDING ) {
			part.type = DTYPE.PADDING;
		}

		else if ( 'magic' in token ) {
			if ('group' in token)			throw new KeyError( 'Magic substructs have not been implemented at this time!' );
			if (token.type == undefined)	throw new KeyError( 'Signature token must have type defined!' );
			if ( typeof token.type === 'number' && typeof token.size === 'number' )
				if (!VerifyType(token.type, token.magic, token.size)) throw new KeyError( 'Magic value does not match component type. This will always return false!' );

			part.magic = token.magic;
			part.type = token.type;
			part.endian = token.endian ?? LITTLE_ENDIAN;
		}

		else {
			if (!( 'name' in token )) throw new KeyError( 'Component must have a name if not magic or padding!' );
			if ( token.type == null && token.group == null ) throw new KeyError( 'Component type or group must be defined!' );
			if ( token.type != null && typeof token.type !== 'function' && token.group != null && typeof token.group !== 'function' )
				throw new KeyError( 'Component type and group cannot both be defined as non-functions!' );

			part.name = token.name;
			part.type = token.type;
			part.group = token.group;
			part.endian = token.endian ?? LITTLE_ENDIAN;
		}

		this.#parts.push(part);
		return this;
	}

	#ask( attr:any|Function ): any {
		if ( typeof attr === 'function' ) return attr(this);
		return attr;
	}

	#askint( attr:any|Function, name:string ): int {
		if ( typeof attr === 'function' ) {
			attr = attr(this);
			if ( typeof attr !== 'number' ) throw new TypeError(`Expected function value of parameter "${name}" to return integer, but got ${typeof attr} instead!`);
			if ( attr%1 ) throw new TypeError(`Expected function value of parameter "${name}" to return integer, but got float instead!`);
		};
		if ( typeof attr !== 'number' ) throw new TypeError(`Expected integer value for parameter "${name}", but found ${typeof attr} instead!`);
		if ( attr%1 ) throw new TypeError(`Expected integer value for parameter "${name}", but found float instead!`);
		return attr;
	}

	/** @private */
	__pack__( data:Object ): Uint8Array {
		this.#context = Object.assign({}, data);

		const bits: Uint8Array[] = [];
		for ( let i=0; i<this.#parts.length; i++ ) {
			const part = this.#parts[i];

			const raw_size						= this.#askint(part.size, 'size');
			const part_type: int|null			= this.#ask(part.type);
			const part_group: SharedStruct|null	= this.#ask(part.group);

			let part_size: int					= raw_size;
			let part_data: any|null				= null;

			/* NORMALIZE INPUT */

			// NULLSTOP support
			if ( part_size === NULLSTOP ) {
				part_size = data[part.name].length;
			}

			// Fix SINGLE
			else if ( raw_size === SINGLE && DNARRAY[part_type] ) {
				part_size = 1;
			}

			// Standard component type
			if ( part.name !== undefined ) {
				if (part_group!=null && part_type!=null) throw new TypeXorError(`Component ${part.name} evaluated to both substruct and component. One of type/group must be non-null!`);
				if (part_group==null && part_type==null) throw new TypeXorError(`Component ${part.name} evaluated to neither substruct or component. One of type/group must be non-null!`);
				part_data = data[part.name];
			}

			// Magic component type
			else if ( part.magic !== undefined ) {
				if ( part_type === null ) throw new KeyError(`Magic component type property resolved to null!`);
				part_data = part.magic;
			}

			/* PACK DATA */

			if ( part_group ) {
				if ( part_size === SINGLE )
					bits.push(part_group.__pack__(part_data));
				else
					for ( let j=0; j<part_size; j++ ) bits.push(part_group.__pack__(part_data[j]));

			}
			else {
				if ( part_size === SINGLE )
					bits.push(Pack(part_type, [part_data], 1, part.endian));
				else
					bits.push(Pack(part_type, part_data, part_size, part.endian));
			}

			if ( raw_size === NULLSTOP ) bits.push( new Uint8Array(1).fill(0x00) );
		}

		let target_size = 0;
		for ( let i=0; i<bits.length; i++ ) target_size += bits[i].length;

		let pointer = 0;
		const target = new Uint8Array(target_size);
		for ( let i=0; i<bits.length; i++ ) {
			target.set(bits[i], pointer);
			pointer += bits[i].length;
		}

		this.#context = null;
		return target;
	}

	/** @private */
	__unpack__( data:Uint8Array, pointer=0 ): [Object, int] {
		this.#context = {};

		for ( let i=0; i<this.#parts.length; i++ ) {
			const part = this.#parts[i];

			const part_type: int|null			= this.#ask(part.type);
			const part_group: SharedStruct|null	= this.#ask(part.group);

			let raw_size						= this.#askint(part.size, 'size');
			let part_size: int					= raw_size;
			let part_data: any|null				= null;

			/* NORMALIZE INPUT */

			if ( part_size === NULLSTOP && part_type != null ) {
				let count = 0, p = pointer;
				const bytesize = DBYTES[part_type];
				while ( p < data.length && data[p] !== 0x00 ) p += bytesize, count++;
				part_size = count;
			}

			// Fix SINGLE
			else if ( raw_size === SINGLE ) {
				if ( part_type != null && DNARRAY[part_type] ) raw_size = 1;
				part_size = 1;
			}

			// Standard component type
			if ( part.name !== undefined ) {
				if (part_group!=null && part_type!=null) throw new TypeXorError(`Part ${part.name} evaluated to both substruct and component. One of type/group must be non-null!`);
				if (part_group==null && part_type==null) throw new TypeXorError(`Part ${part.name} evaluated to neither substruct or component. One of type/group must be non-null!`);
			}

			// Magic component type
			else if ( part.magic !== undefined ) {
				if ( part_type === null ) throw new KeyError(`Magic component type property resolved to null!`);

				let bytecount = part_size * DBYTES[part_type];
				part_data = data.slice( pointer, pointer += bytecount );

				let unpacked: any;
				if ( raw_size === SINGLE ) {
					[unpacked] = Unpack(part_type, part_data, 1, part.endian);
					if ( unpacked !== part.magic ) throw new ParseError( `Failed to match magic signature! ${unpacked} !== ${part.magic}` );
				}

				else {
					unpacked = Unpack(part_type, part_data, part_size, part.endian);
					if ( unpacked.length !== part.magic.length ) throw new ParseError( `Failed to match magic signature! ${unpacked.constructor.name}(${unpacked.length}) !== ${part.magic.constructor.name}(${part.magic.length})` );
					for ( let j=0; j<part.magic.length; j++ )
						if ( unpacked[j] !== part.magic[j] ) throw new ParseError( `Failed to match magic signature! Item ${j}: ${unpacked[j]} !== ${part.magic[j]}` );
				}

				continue;
			}

			// Padding component type
			else if ( part.type === DTYPE.PADDING ) {
				pointer += part_size;
				continue;
			}

			/* UNPACK DATA */

			let unpacked: any;
			if (part_group) {
				if ( raw_size === SINGLE )
					[unpacked, pointer] = part_group.__unpack__(data, pointer);

				else if ( raw_size === NULLSTOP ) {
					let count = 0;
					unpacked = [];
					while ( pointer < data.length ) {
						if ( data[pointer] === 0x00 ) break;
						[unpacked[count], pointer] = part_group.__unpack__(data, pointer);
						count++;
					}
				}

				else {
					unpacked = new Array(part_size);
					for ( let j=0; j<part_size; j++ ) [unpacked[j], pointer] = part_group.__unpack__(data, pointer);
				}
			}

			else {
				part_data = data.slice( pointer, pointer += DBYTES[part_type]*part_size );
				if ( raw_size === NULLSTOP ) pointer++;
				if ( pointer > data.length ) throw new BufferError(`Not enough data! (Attempted to access byte at index ${pointer})`);

				if ( raw_size === SINGLE )
					[unpacked] = Unpack(part_type, part_data, 1, part.endian);
				else
					unpacked = Unpack(part_type, part_data, part_size, part.endian);
			}

			this.#context[part.name] = unpacked;
		}

		const target = Object.assign({}, this.#context);
		this.#context = null;
		return [target, pointer];
	}
}

export class Struct extends InternalStruct {
	constructor( struct?:string|Component[] ) {
		super(struct);
	}

	/**
	 * Packs the values of an object into a buffer via this Struct's layout.
	 * @param data The data to pack into the buffer.
	 * @returns An array of bytes.
	 */
	pack( data:Object ) {
		return super.__pack__(data);
	}

	/**
	 * Unpacks the values from a buffer into an object via this Struct's layout.
	 * @param data An array of bytes.
	 * @returns An object containing the unpacked values.
	 */
	unpack( data:Uint8Array ) {
		return super.__unpack__(data)[0];
	}
}