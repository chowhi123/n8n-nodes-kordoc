const assert = require('node:assert/strict');
const test = require('node:test');

const { KorDoc } = require('../dist/nodes/KorDoc/KorDoc.node.js');
const { parse } = require('../dist/vendor/kordoc/index.cjs');
const pkg = require('../package.json');

test('declares the n8n node contract', () => {
	const node = new KorDoc();
	assert.equal(node.description.displayName, 'KorDoc Parser');
	assert.equal(node.description.name, 'korDoc');
	assert.equal(node.description.properties.length, 3);
});

test('bundles a callable KorDoc parser', async () => {
	const result = await parse(Buffer.alloc(0));
	assert.equal(result.success, false);
	assert.equal(result.code, 'EMPTY_INPUT');
});

test('declares dependencies required by the bundled parser', () => {
	assert.equal(pkg.dependencies.cfb, '1.2.2');
});

test('honors continueOnFail for missing binary input', async () => {
	const node = new KorDoc();
	const context = {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name) =>
			({ binaryPropertyName: 'data', outputFormat: 'markdown', extractImages: false })[name],
		getNode: () => ({
			name: 'KorDoc Parser',
			type: 'korDoc',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		}),
		continueOnFail: () => true,
	};

	const [output] = await node.execute.call(context);
	assert.match(output[0].json.error, /No binary data found/);
	assert.deepEqual(output[0].pairedItem, { item: 0 });
});
