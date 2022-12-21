import { DTYPE, DBYTES, DNARRAY, Pack, Unpack, SINGLE, SYSTEM_ENDIAN, DSHORT, LITTLE_ENDIAN, BIG_ENDIAN } from './datatype.js';
import { InternalPart, ExternalPart, SharedStruct, int, KeyError, TypeXorError, BufferError, ParseError } from './types.js';


// type DataTarget = Object|ArrayLike<any>|Map<string,any>;
// interface StructDataOptions {
// 	make:	() => DataTarget,
// 	get:	( target:DataTarget, id:int, name:string ) => any,
// 	set:	( target:DataTarget, value:any, id:int, name:string ) => void,
// }


/* Complex Struct Class */

export class InternalStruct {
	#parts: InternalPart[] = [];
	#map: {[key: string]: InternalPart} = {};
	#context: {}|null = null;
	// get __parts__() { return this.#parts };

	// #static: boolean = true;
	// #static_size: int = 0;

	constructor( struct?:string|ExternalPart[] ) {
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

	eval( name:string ) {
		if (!this.#context) throw('Attempted to access Struct context outside of pack/unpack routine!');
		return this.#context[name];
	}

	add( token:ExternalPart ) {

		const norm_group  = ('group'  in token && !!token.group) ? token.group : null,
		      norm_type   = ('type'   in token && token.type   !== null && token.type   !== undefined) ? token.type : null,
		      norm_endian = ('endian' in token && token.endian !== null && token.endian !== undefined && norm_type) ? token.endian : null;

		const part = {
			name:	token.name ?? null,
			size:	token.size ?? SINGLE,
			endian:	norm_endian ?? LITTLE_ENDIAN,
			group:	norm_group,
			type:	norm_type,
		}

		if (part.type !== DTYPE.PADDING && part.name === null) throw(`Part with datatype ${part.type} is missing name!`);
		if (norm_group === null && norm_type === null) throw('Part has neither group or type defined!');
		this.#parts.push(part as InternalPart);
	}

	#ask( attr:any|Function ): any {
		if ( typeof attr === 'function' ) return attr();
		return attr;
	}

	#askint( attr:any|Function, name:string ): int {
		if ( typeof attr === 'function' ) {
			attr = attr();
			if ( typeof attr !== 'number' ) throw new TypeError(`Expected function value of parameter "${name}" to return integer, but got ${typeof attr} instead!`);
			if ( attr%1 ) throw new TypeError(`Expected function value of parameter "${name}" to return integer, but got float instead!`);
		};
		if ( typeof attr !== 'number' ) throw new TypeError(`Expected integer value for parameter "${name}", but found ${typeof attr} instead!`);
		if ( attr%1 ) throw new TypeError(`Expected integer value for parameter "${name}", but found float instead!`);
		return attr;
	}

	__pack__( data:Object ): Uint8Array {
		this.#context = Object.assign({}, data);

		const bits: Uint8Array[] = [];
		for ( let i=0; i<this.#parts.length; i++ ) {
			const part = this.#parts[i];

			try {
			const part_rsize  = this.#askint(part.size, 'size');
			const part_fsize  = (part_rsize===SINGLE) ? 1 : part_rsize;
			const part_type   = (part.type===null) ? null : this.#ask(part.type);
			const part_group  = (part.group===null) ? null : this.#ask(part.group);
			const part_data   = (part.name===null) ? null : data[part.name];

			if (part_group!==null && part_type!==null) throw new TypeXorError(`Part ${part.name} evaluated to both substruct and component. One of type/group must be non-null!`);
			if (part_group===null && part_type===null) throw new TypeXorError(`Part ${part.name} evaluated to neither substruct or component. One of type/group must be non-null!`);

			if (part_group) {
				/* SUBSTRUCT */

				// Validate
				if (part_data===undefined) throw new KeyError(`Substruct ${part.name} was not provided with context in input!`);

				// Write
				if (part_rsize===SINGLE)	bits.push(part_group.__pack__(part_data));
				else 						for ( let j=0; j<part_fsize; j++ ) bits.push(part_group.__pack__(part_data[j]));

			}
			else {
				/* COMPONENT */

				// Validate
				if (part_data===undefined && part.name!==null ) throw new KeyError(`Component ${part.name} was not provided with data in input!`);

				// Write
				if (part_rsize===SINGLE && !DNARRAY[part_type as number])
						bits.push(Pack(part_type as number, [part_data], part_fsize, part.endian));
				else	bits.push(Pack(part_type as number, part_data, part_fsize, part.endian));
			}
			} catch(error) { console.log(`An error occurred while processing part ${part.name}:`); throw(error); }
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

	__unpack__( data:Uint8Array, pointer=0 ): [Object, int] {
		this.#context = {};

		for ( let i=0; i<this.#parts.length; i++ ) {
			const part = this.#parts[i];

			try {
			const part_rsize  = this.#askint(part.size, 'size');
			const part_fsize  = (part_rsize===SINGLE) ? 1 : part_rsize;
			const part_type   = (part.type===null) ? null : this.#ask(part.type);
			const part_group  = (part.group===null) ? null : this.#ask(part.group);
			let unpacked: any;

			if (part_group!==null && part_type!==null) throw new TypeXorError(`Part ${part.name} evaluated to both substruct and component. One of type/group must be non-null!`);
			if (part_group===null && part_type===null) throw new TypeXorError(`Part ${part.name} evaluated to neither substruct or component. One of type/group must be non-null!`);

			if (part_group) {
				/* SUBSTRUCT */

				if (part_rsize === SINGLE)
					[unpacked,] = part_group.__unpack__(data, pointer);
				else {
					unpacked = new Array(part_fsize);
					for ( let j=0; j<part_fsize; j++ ) [unpacked[j], pointer] = part_group.__unpack__(data, pointer);
				}
			}

			else {
				/* COMPONENT */

				const size_bytes = part_fsize*DBYTES[part_type];
				pointer += size_bytes;

				if (pointer > data.length) throw new BufferError(`Not enough data! (Attempted to access byte at index ${pointer})`);
				if (part.type !== DTYPE.PADDING) {
					unpacked = Unpack(part_type, data.slice(pointer-size_bytes, pointer), part_fsize, part.endian);
					if (part_rsize === SINGLE && !DNARRAY[part_type]) [unpacked] = unpacked;
				}
			}

			if (unpacked !== undefined) this.#context[part.name as string] = unpacked;
			} catch(error) { console.log(`An error occurred while processing part ${part.name}:`); throw(error); }
		}

		const target = Object.assign({}, this.#context);
		this.#context = null;
		return [target, pointer];
	}
}

export class Struct extends InternalStruct {
	constructor( struct?:string|ExternalPart[] ) {
		super(struct);
	}

	pack( data:Object ) {
		return super.__pack__(data);
	}

	unpack( data:Uint8Array ) {
		return super.__unpack__(data)[0];
	}
}