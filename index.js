export default function arrify(value) {
	console.log("看一下是否可迭代",typeof value[Symbol.iterator]);
	if (value === null || value === undefined) {
		return [];
	}

	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value === 'string') {
		return [value];
	}

	if (typeof value[Symbol.iterator] === 'function') {
		return [...value];
	}

	return [value];
}

console.log(arrify(false ? [1, 2] : {}));
console.log(arrify('🦄'));
console.log(arrify({ name: 'summer' }));
