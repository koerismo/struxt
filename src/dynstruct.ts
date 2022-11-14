import { DTYPE, DSIZE, Pack, Unpack, system_endianness, int } from './datatype.js';


/* Common Type Definitions */

type ReturnsInt = () => int;
type ReturnsStruct = () => Struct;
type ComplexPart = Part|Substruct;

export interface Part {
	name:	string,
	type:	number|ReturnsInt,
	size:	number|ReturnsInt,
	endian: boolean,
};

export interface Substruct {
	name:	string,
	group:	Struct|ReturnsStruct,
};

export const SINGLE = -1;

/* Complex Struct Class */

export class Struct {
	#parts: ComplexPart[] = [];
	#map: {[key: string]: ComplexPart} = {};
	#context: {}|null = null;

	#static: boolean = true;
	#static_size: int = 0;
	
	constructor() {
	}

	eval( name:string ) {
		if (!this.#context) throw('Attempted to access Struct context outside of pack/unpack routine!');
		return this.#context[name];
	}

	add( token:ComplexPart ) {
		if (!token.name) throw(`Token must have name!`);

		//@ts-ignore
		if (!token.group && (token.type==undefined || token.size==undefined || token.endian==undefined)) throw('Token must have name, type, size, and endian defined!');
		//@ts-ignore
		if (token.group || typeof token.size==='function' || typeof token.type==='function') this.#static = false;
		//@ts-ignore
		if (this.#static) this.#static_size += DSIZE[token.type]*token.size;

		this.#parts.push(token);
		this.#map[token.name] = token;
	}

	#ask( attr:any|Function ): any {
		if ( typeof attr === 'function' ) return attr();
		return attr;
	}

	predict_packed_size() {
		if (!this.#context && !this.#static) throw('Dynamic struct size cannot be predicted outside of pack context!');
		if (this.#static) return this.#static_size;
	}

	pack( data:Object ): Uint8Array {
		this.#context = Object.assign({}, data);

		const bits: Uint8Array[] = [];
		for ( let i=0; i<this.#parts.length; i++ ) {
			const part = this.#parts[i];
			if (!( part.name in data )) throw(`Parameter ${part.name} is missing from input!`);

			const input = data[part.name];
			let packed: Uint8Array;

			// Substruct
			if ('group' in part) { packed = this.#ask(part.group).pack(input); }
			// Part
			else { packed = Pack(this.#ask(part.type), data[part.name], this.#ask(part.size), part.endian); }
			
			bits.push(packed);
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
			let unpacked:any;
			
			if ('group' in part) {
				[unpacked, pointer] = this.#ask(part.group).__unpack(data, pointer);
			}

			else {
				const data_type = this.#ask(part.type);
				const data_size = this.#ask(part.size);
				const data_bytes = data_size*DSIZE[data_type];
				if (pointer+data_bytes > data.length) throw(`Not enough data! (failed to access byte at 0x${(pointer+data_bytes).toString(16)}!)`)

				unpacked = Unpack(data_type, data.slice(pointer, pointer+data_bytes), data_size, part.endian);
				pointer += data_bytes;
			}

			this.#context[part.name] = unpacked;
		}

		const target = Object.assign({}, this.#context);
		this.#context = null;

		return [target, pointer];
	}
}