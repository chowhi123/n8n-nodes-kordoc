import type {
	IBinaryKeyData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const { parse } = require('../../vendor/kordoc/index.cjs') as typeof import('kordoc');

export class KorDoc implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KorDoc Parser',
		name: 'korDoc',
		icon: 'file:kordoc.svg',
		group: ['transform'],
		version: 1,
		description: 'Convert HWP, HWPX, PDF, and Office documents to Markdown or JSON',
		defaults: {
			name: 'KorDoc Parser',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the document',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Markdown',
						value: 'markdown',
					},
					{
						name: 'JSON',
						value: 'json',
					},
				],
				default: 'markdown',
			},
			{
				displayName: 'Extract Images',
				name: 'extractImages',
				type: 'boolean',
				default: false,
				description: 'Whether to return embedded images as binary properties',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const binaryPropertyName = this.getNodeParameter(
					'binaryPropertyName',
					itemIndex,
				) as string;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as
					| 'markdown'
					| 'json';
				const extractImages = this.getNodeParameter('extractImages', itemIndex) as boolean;
				const inputBinary = items[itemIndex].binary?.[binaryPropertyName];

				if (!inputBinary) {
					throw new NodeOperationError(
						this.getNode(),
						`No binary data found in property "${binaryPropertyName}"`,
						{ itemIndex },
					);
				}

				const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
				const result = await parse(buffer);

				if (!result.success) {
					throw new NodeOperationError(
						this.getNode(),
						`KorDoc parsing failed: ${result.error}${result.code ? ` (${result.code})` : ''}`,
						{ itemIndex },
					);
				}

				const content =
					outputFormat === 'markdown'
						? result.markdown
						: (JSON.parse(
								JSON.stringify(
									{ ...result, images: undefined },
									(key, value) => (key === 'imageData' ? undefined : value),
								),
							) as IDataObject);
				const binary: IBinaryKeyData = {};

				if (extractImages) {
					for (const [imageIndex, image] of (result.images ?? []).entries()) {
						binary[`image_${imageIndex}`] = await this.helpers.prepareBinaryData(
							Buffer.from(image.data),
							image.filename,
							image.mimeType,
						);
					}
				}

				returnData.push({
					json: {
						fileName: inputBinary.fileName ?? 'document',
						content,
						parsedAt: new Date().toISOString(),
					},
					...(Object.keys(binary).length > 0 ? { binary } : {}),
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw error instanceof NodeOperationError
					? error
					: new NodeOperationError(this.getNode(), error, { itemIndex });
			}
		}

		return [returnData];
	}
}
