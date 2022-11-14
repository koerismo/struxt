import { DTYPE, DSIZE, Pack, Unpack, system_endianness } from './datatype.js';

interface Part {
	name:	string,
	type:	number,
	size:	number, // TODO: Add Function as type.
	endian: boolean,
}

const MODE_NONE	  = 0,
      MODE_PACK   = 1,
      MODE_UNPACK = 2;


export class Construct {
	parts: Part[];
	map: Object;

	#mode: 0|1|2		= MODE_NONE;
	#dir:  Object|null	= null;

	constructor( parts: Part[]=[] ) {
		this.parts = parts;
		this.map   = {};
		for ( let i=0; i<this.parts.length; i++ ) this.map[this.parts[i].name] = this.parts[i];
	}

	eval( name: string ) {
		if ( this.#mode === MODE_NONE || !this.#dir ) throw( 'Eval can only be used within pack/unpack calls!' );
		return this.#dir[name];
	}

	pack( data: Object ) {
		let target_size = 0;
		for ( let part of this.parts ) target_size += DSIZE[part.type]*part.size;
		
		let pointer = 0;
		const target = new Uint8Array(target_size);
		for ( let name in data ) {
			const part = this.map[name];
			const packed = Pack(part.type, data[name], part.size, part.endian);

			target.set(packed, pointer);
			pointer += packed.length;
		}

		return target;
	}

	unpack( data: Uint8Array ) {
		let requested_size = 0;
		for ( let part of this.parts ) requested_size += DSIZE[part.type]*part.size;
		if ( data.length != requested_size ) throw new RangeError(`Construct.unpack expected input of length ${requested_size}, but received ${data.length} instead!`);

		let pointer = 0;
		const target = {};
		for ( let part of this.parts ) {
			const part_size = part.size*DSIZE[part.type];
			const sliced = data.slice(pointer, pointer+part_size);
			pointer += part_size;

			target[part.name] = Unpack(part.type, sliced, part.size, part.endian);
		}

		return target;
	}

}