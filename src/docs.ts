// Wrapping an item in () should make it act as a shortcut.
// Adding a number before a bracketed section should duplicate the contents x times
// 3(hhh) --> hhhhhhhhh

// Elements can be wrapped in [] brackets to signify that its contents should be inserted
// into a vector rather than directly with everything else. They can be stacked.
// [3[hhh]] --> <<hhh>, <hhh>, <hhh>>

// Variable names can also be wrapped in {} brackets to denote that they should be replaced with
// values of the same name specified in the pack() replace arguments
// pack('[{somevar}[ih]]', [[0,0],[1,1]], { somevar: 2 }) --> ihih

// c: char					(1)
// C: unsigned char			(1)

// h: short					(2)
// H: unsigned short		(2)

// i: int					(4)
// I: unsigned int			(4)

// l: long					(4)
// L: unsigned long			(4)

// q: long long				(8)
// Q: unsigned long long	(8)

// f: float					(4)
// d: double				(8)

// s: char					(1)