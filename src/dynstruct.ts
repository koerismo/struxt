import { DTYPE, DSIZE, Pack, Unpack, int, SINGLE, SYSTEM_ENDIAN } from './datatype.js';


/* Common Type Definitions */

type ReturnsInt = () => int;
type ReturnsStruct = () => Struct;
type ComplexPart = Part|Substruct;

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
	
	constructor() {
	}

	eval( name:string ) {
		if (!this.#context) throw('Attempted to access Struct context outside of pack/unpack routine!');
		return this.#context[name];
	}

	add( token:ComplexPart ) {
		if (!token.name) throw(`Token must have name!`);

		//@ts-ignore
		if (!token.group && (token.type===undefined || token.size===undefined || token.endian===undefined)) throw('Token must have name, type, size, and endian defined!');
		//@ts-ignore
		if (token.group && token.size===undefined) throw('Token must have size defined!');
		//@ts-ignore
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

			if (!( part.name in data )) throw(`Parameter ${part.name} is missing from input!`);
			const input = data[part.name];

			// Substruct
			if ('group' in part) {
				const part_group = this.#ask(part.group);

				if (part_rawsize === SINGLE)		bits.push(part_group.pack(input));
				else								for ( let j=0; j<part_size; j++ ) { bits.push(part_group.pack(input[j]) ); }
			}
			// Part
			else { bits.push(Pack(this.#askint(part.type), data[part.name], part_rawsize, part.endian)) }
		
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

			let unpacked:any;
			if ('group' in part) {
				const part_group = this.#ask(part.group);
				
				unpacked = new Array(part_size);
				if (part_rawsize === SINGLE)	[unpacked,] = part_group.__unpack(data, pointer);
				else 							for ( let j=0; j<part_size; j++ ) [unpacked[j], pointer] = part_group.__unpack(data, pointer);
			}

			else {
				const data_type = this.#askint(part.type);
				const data_bytes = part_size*DSIZE[data_type];
				if (pointer+data_bytes > data.length) throw(`Not enough data! (failed to access byte at ${pointer+data_bytes}!)`)

				unpacked = Unpack(data_type, data.slice(pointer, pointer+data_bytes), part_rawsize, part.endian);
				pointer += data_bytes;
			}

			this.#context[part.name] = unpacked;
		}

		const target = Object.assign({}, this.#context);
		this.#context = null;

		return [target, pointer];
	}
}