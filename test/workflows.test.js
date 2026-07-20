const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

test('publishes generated version tags through the npm workflow', () => {
	const update = readFileSync('.github/workflows/auto-update-kordoc.yml', 'utf8');
	const publish = readFileSync('.github/workflows/publish.yml', 'utf8');

	assert.match(update, /gh workflow run publish\.yml/);
	assert.match(publish, /id-token: write/);
	assert.match(publish, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/);
	assert.match(publish, /npm publish --provenance/);
	assert.match(publish, /RELEASE_TAG/);
});
