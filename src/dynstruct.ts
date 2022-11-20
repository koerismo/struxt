import { DTYPE, DSIZE, Pack, Unpack, int, SINGLE, SYSTEM_ENDIAN, DSHORT, LITTLE_ENDIAN, BIG_ENDIAN } from './datatype.js';


/* Common Type Definitions */

type SharedStruct = Struct|InternalStruct;
type ReturnsInt = () => int;
type ReturnsStruct = () => SharedStruct;
type ComplexPart = (Part|Substruct) & {
	name:		string,
	type?:		int|ReturnsInt,
	size?:		int|ReturnsInt,
	group?:		SharedStruct|ReturnsStruct,
	endian?:	boolean,
};

export interface Part {
	name:	string,
	type:	int|ReturnsInt,
	size:	int|ReturnsInt,
	endian: boolean,
};

export interface Substruct {
	name:	string,
	size:	int|ReturnsInt,
	group:	SharedStruct|ReturnsStruct,
};

type DataTarget = Object|ArrayLike<any>|Map<string,any>;
interface StructDataOptions {
	make:	() => DataTarget,
	get:	( target:DataTarget, id:int, name:string ) => any,
	set:	( target:DataTarget, value:any, id:int, name:string ) => void,
}


/* Complex Struct Class */

export class InternalStruct {
	#parts: ComplexPart[] = [];
	#map: {[key: string]: ComplexPart} = {};
	#context: {}|null = null;
	// get __parts__() { return this.#parts };

	// #static: boolean = true;
	// #static_size: int = 0;

	constructor( struct?:string|ComplexPart[] ) {
		const parents = new WeakMap();
		const sizes = new WeakMap();
		const indices = new WeakMap();
		indices.set(this, 0);

		if (!struct) return;
		if (typeof struct === 'string') {
			let last_size = SINGLE,
			    last_order = SYSTEM_ENDIAN,
				active_struct: SharedStruct = this;

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

					if (size === undefined) throw(`Encountered extra end bracket at pos ${i} in struct string!`);
					parent.add({ name:indices.get(parent).toString(), group:active_struct, size:size ?? SINGLE });
					active_struct = parent;
					last_size = SINGLE;
					continue;
				}

				// Comments
				if (char === ' ' || char === '\n' || char === '\t') continue;

				// Unrecognized character
				if (DSHORT[char] === undefined) throw(`Unrecognized struct char ${char} at C${i}!`);

				active_struct.add({ name:indices.get(active_struct).toString(), type:DSHORT[struct[i]], size:last_size, endian:last_order });
				indices.set(active_struct, indices.get(active_struct)+1);
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

	add( token:ComplexPart ) {
		if (!token.name) throw(`Token must have name!`);

		
		if (!token.group && (token.type===undefined || token.size===undefined || token.endian===undefined)) throw('Token must have name, type, size, and endian defined!');
		if (token.group && token.size===undefined) throw('Token must have size defined!');
		if (token.size===SINGLE && token.type===DTYPE.STR) throw('String token size cannot be SINGLE!');

		// if (token.group || typeof token.size==='function' || typeof token.type==='function') this.#static = false;
		// if (this.#static) this.#static_size += DSIZE[token.type]*token.size;

		this.#parts.push(token);
		this.#map[token.name] = token;
	}

	#ask( attr:any|Function ): any {
		if ( typeof attr === 'function' ) return attr();
		return attr;
	}

	#askint( attr:any|Function ): int {
		if ( typeof attr === 'function' ) {
			attr = attr();
			if ( typeof attr !== 'number' ) throw(`Expected parameter function to return integer, but got ${typeof attr} instead!`);
			if ( attr%0 ) throw(`Expected parameter function to return integer, but got float instead!`);
		};
		if ( typeof attr !== 'number' ) throw(`Expected integer in parameter, but found ${typeof attr} instead!`);
		if ( attr%0 ) throw(`Expected integer in parameter, but found float instead!`);
		return attr;
	}

	// predict_packed_size() {
	// 	if (!this.#context && !this.#static) throw('Dynamic struct size cannot be predicted outside of pack context!');
	// 	if (this.#static) return this.#static_size;
	// }

	__pack__( data:Object ): Uint8Array {
		this.#context = Object.assign({}, data);

		const bits: Uint8Array[] = [];
		for ( let i=0; i<this.#parts.length; i++ ) {
			const part = this.#parts[i];
			const part_rawsize = this.#askint(part.size);
			const part_size = (part_rawsize === SINGLE) ? 1 : part_rawsize;
			const part_type: int|undefined = this.#ask(part.type);
			const input: Object|undefined = data[part.name];

			// Substruct
			if ('group' in part) {
				const part_group = this.#ask(part.group);

				// Validity checks
				if (input === undefined) throw(`Substruct ${part.name} is missing from data!`);
				if (!(part_group instanceof InternalStruct)) throw(`Expected Struct or Struct-returning function in group ${part.name}, got ${part_group} instead!`);

				if (part_rawsize === SINGLE)		bits.push(part_group.__pack__(input));
				else								for ( let j=0; j<part_size; j++ ) { bits.push(part_group.__pack__(input[j]) ); }
			}

			// Part
			else {
				// Validity check
				if (input === undefined && part_type !== DTYPE.PADDING ) throw(`Parameter ${part.name} is missing from data!`);
				bits.push(Pack(part_type ?? -1, data[part.name], part_rawsize, part.endian));
			}
		
		}

		let target_size = 0;
		for ( let bit of bits ) target_size += bit.length;

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
			const part_rawsize = this.#askint(part.size);
			const part_size = (part_rawsize === SINGLE) ? 1 : part_rawsize;
			let part_type:int|undefined;

			let unpacked:any;
			if ('group' in part) {
				const part_group: SharedStruct = this.#ask(part.group);
				
				unpacked = new Array(part_size);
				if (part_rawsize === SINGLE)	[unpacked,] = part_group.__unpack__(data, pointer);
				else 							for ( let j=0; j<part_size; j++ ) [unpacked[j], pointer] = part_group.__unpack__(data, pointer);
			}

			else {
				part_type = this.#askint(part.type);
				const data_bytes = part_size*DSIZE[part_type];
				if (pointer+data_bytes > data.length) throw(`Not enough data! (failed to access byte at ${pointer+data_bytes}!)`)

				unpacked = Unpack(part_type, data.slice(pointer, pointer+data_bytes), part_rawsize, part.endian);
				pointer += data_bytes;
			}

			if (part_type !== DTYPE.PADDING)
				this.#context[part.name] = unpacked;
		}

		const target = Object.assign({}, this.#context);
		this.#context = null;

		return [target, pointer];
	}
}


export class Struct extends InternalStruct {
	constructor( struct?:string|ComplexPart[] ) {
		super(struct);
	}

	pack( data:Object ) {
		return super.__pack__(data);
	}

	// arr_pack( data:Array<any> ) {
	// 	return super.pack(data);
	// }

	unpack( data:Uint8Array ) {
		return super.__unpack__(data)[0];
	}

	// arr_unpack( data:Uint8Array ) {

	// }
}