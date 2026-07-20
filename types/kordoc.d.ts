declare module 'kordoc' {
	interface ExtractedImage {
		filename: string;
		data: Uint8Array;
		mimeType: string;
	}

	interface ParseSuccess {
		success: true;
		fileType: string;
		markdown: string;
		blocks: unknown[];
		metadata?: unknown;
		outline?: unknown[];
		warnings?: unknown[];
		images?: ExtractedImage[];
		[key: string]: unknown;
	}

	interface ParseFailure {
		success: false;
		fileType: string;
		error: string;
		code?: string;
		[key: string]: unknown;
	}

	export function parse(input: Buffer | ArrayBuffer | string): Promise<ParseSuccess | ParseFailure>;
}
