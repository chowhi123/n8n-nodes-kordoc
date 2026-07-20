const { execFileSync } = require('node:child_process');
const { cpSync, existsSync, readFileSync, rmSync } = require('node:fs');
const path = require('node:path');
const { build } = require('tsup');

const root = path.resolve(__dirname, '..');
const source = path.join(root, '.kordoc-source');
const outDir = path.join(root, 'dist', 'vendor', 'kordoc');
const repository = 'https://github.com/chrisryugj/kordoc.git';

function lockedCommit() {
	const lockPath = path.join(root, 'package-lock.json');
	if (!existsSync(lockPath)) return undefined;

	const packages = JSON.parse(readFileSync(lockPath, 'utf8')).packages ?? {};
	const entry = Object.entries(packages).find(
		([name, value]) => name.endsWith('node_modules/kordoc') && value?.resolved,
	)?.[1];
	return entry?.resolved?.match(/#([0-9a-f]{40})$/)?.[1];
}

async function main() {
	rmSync(path.join(root, 'dist'), { recursive: true, force: true });
	rmSync(source, { recursive: true, force: true });
	execFileSync('git', ['init', source], { stdio: 'ignore' });
	execFileSync('git', ['-C', source, 'remote', 'add', 'origin', repository]);
	execFileSync(
		'git',
		['-C', source, 'fetch', '--depth', '1', 'origin', lockedCommit() ?? 'HEAD'],
		{ stdio: 'inherit' },
	);
	execFileSync('git', ['-C', source, 'checkout', '--detach', 'FETCH_HEAD'], { stdio: 'ignore' });

	const pkg = JSON.parse(readFileSync(path.join(source, 'package.json'), 'utf8'));
	await build({
		entry: { index: path.join(source, 'src', 'index.ts') },
		format: ['cjs'],
		outDir,
		outExtension: () => ({ js: '.cjs' }),
		clean: true,
		splitting: false,
		shims: true,
		external: [
			'pdfjs-dist',
			'puppeteer-core',
			'onnxruntime-node',
			'@huggingface/transformers',
			'@hyzyla/pdfium',
			'sharp',
		],
		define: { __KORDOC_VERSION__: JSON.stringify(pkg.version) },
	});

	for (const file of ['LICENSE', 'NOTICE']) {
		cpSync(path.join(source, file), path.join(outDir, file));
	}
	cpSync(path.join(source, 'THIRD_PARTY'), path.join(outDir, 'THIRD_PARTY'), {
		recursive: true,
	});
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => rmSync(source, { recursive: true, force: true }));
