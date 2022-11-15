import { DTYPE, DSIZE, Pack, Unpack, int, SINGLE, SYSTEM_ENDIAN, DSHORT, LITTLE_ENDIAN, BIG_ENDIAN } from './datatype.js';


/* Common Type Definitions */

type ReturnsInt = () => int;
type ReturnsStruct = () => Struct;
type ComplexPart = (Part|Substruct) & {
	name:	string,
	type?:	int|ReturnsInt,
	size?:	int|ReturnsInt,
	group?:	Struct|ReturnsStruct,
	endian:	boolean,
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
	group:	Struct|ReturnsStruct,
};

/* Complex Struct Class */

export class Struct {
	#parts: ComplexPart[] = [];
	#map: {[key: string]: ComplexPart} = {};
	#context: {}|null = null;

	// #static: boolean = true;
	// #static_size: int = 0;
	
	constructor( struct?:string|ComplexPart[] ) {
		if (!struct) return;
		if (typeof struct === 'string') {
			let last_size=SINGLE,
			    last_order=SYSTEM_ENDIAN;

			for ( let i=0; i<struct.length; i++ ) {
				const c = struct[i];

				if (c === '<') { last_order = LITTLE_ENDIAN; continue }
				if (c === '>') { last_order = BIG_ENDIAN; continue }

				const _i = parseInt(struct[i]);
				if (!isNaN(_i)) {
					if (last_size === SINGLE) last_size = _i;
					else last_size = last_size*10 + _i;
					continue;
				}

				this.add({ name: i.toString(), type:DSHORT[struct[i]], size:last_size, endian:last_order });
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

	pack( data:Object ): Uint8Array {
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
				if (!(part_group instanceof Struct)) throw(`Expected Struct or Struct-returning function in group ${part.name}, got ${part_group} instead!`);

				if (part_rawsize === SINGLE)		bits.push(part_group.pack(input));
				else								for ( let j=0; j<part_size; j++ ) { bits.push(part_group.pack(input[j]) ); }
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

	unpack( data: Uint8Array ): Object {
		return this.__unpack(data, 0)[0];
	}

	__unpack( data:Uint8Array, pointer=0 ): Object {
		this.#context = {};

		for ( let i=0; i<this.#parts.length; i++ ) {
			const part = this.#parts[i];
			const part_rawsize = this.#askint(part.size);
			const part_size = (part_rawsize === SINGLE) ? 1 : part_rawsize;
			let part_type:int|undefined;

			let unpacked:any;
			if ('group' in part) {
				const part_group = this.#ask(part.group);
				
				unpacked = new Array(part_size);
				if (part_rawsize === SINGLE)	[unpacked,] = part_group.__unpack(data, pointer);
				else 							for ( let j=0; j<part_size; j++ ) [unpacked[j], pointer] = part_group.__unpack(data, pointer);
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