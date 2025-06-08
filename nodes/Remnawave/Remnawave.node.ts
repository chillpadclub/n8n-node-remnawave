import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
    NodeConnectionType,
} from 'n8n-workflow';

export class Remnawave implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Remnawave',
		name: 'remnawave',
		group: ['transform'],
		version: 1,
		icon: 'fa:plug',
		description: 'Interact with the Remnawave API',
		defaults: {
			name: 'Remnawave',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'remnawaveApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				options: [
					{ name: 'Create User', value: 'createUser' },
                    { name: 'Get Users', value: 'getUsers' },
					{ name: 'Check User', value: 'checkUser' },
                    { name: 'Update User', value: 'updateUser' },
					{ name: 'Delete User', value: 'deleteUser' },
				],
				default: 'createUser',
			},
            {
            	displayName: 'Identifier Type',
            	name: 'identifierType',
            	type: 'options',
            	options: [
            		{ name: 'UUID', value: 'uuid' },
                    { name: 'Short UUID', value: 'short-uuid' },
            		{ name: 'Username', value: 'username' },
                    { name: 'Telegram ID', value: 'telegram-id' },
            		{ name: 'Email', value: 'email' },
            	],
            	default: 'uuid',
            	description: 'Type of identifier used to locate the user',
                displayOptions: {
		            show: {
			            action: ['checkUser'],
		            },
	            },
            },
            {
            	displayName: 'Identifier',
            	name: 'identifierValue',
            	type: 'string',
            	default: '',
            	required: true,
            	description: 'The actual value of the identifier, e.g., UUID, username or email',
                displayOptions: {
		            show: {
			            action: ['checkUser'],
		            },
	            },
            },
            {
                displayName: 'Update Fields',
                name: 'updateFields',
                type: 'json',
                default: {},
                description: 'JSON object with fields to update',
                required: true,
                displayOptions: {
                    show: {
                        action: ['updateUser', 'createUser'],
                    },
                },
            },
            {
            	displayName: 'UUID',
            	name: 'identifierValue',
            	type: 'string',
            	default: '',
            	required: true,
            	description: 'User UUID to delete',
            	displayOptions: {
            		show: {
            			action: ['deleteUser'],
            		},
            	},
            },

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('remnawaveApi');
		const apiUrl = (credentials.url as string).replace(/\/+$/, '');
		const apiKey = credentials.apiKey as string;

		const headers = {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		};

		for (let i = 0; i < items.length; i++) {
			const action = this.getNodeParameter('action', i) as string;

			let response;

			try {
                let method: 'GET' | 'DELETE' | 'PATCH' | 'POST' = 'GET';
                let body: object | undefined = undefined;
                let url = '';

				if (action === 'createUser') {
                    method = 'POST';
                    const rawUpdateFields = this.getNodeParameter('updateFields', i, '{}');
                    let parsedUpdateFields: object;

                    try {
                        parsedUpdateFields = typeof rawUpdateFields === 'string'
                            ? JSON.parse(rawUpdateFields)
                            : rawUpdateFields;
                    } catch (error) {
                        throw new Error('Invalid JSON provided in Update Fields');
                    }

                    body = { ...parsedUpdateFields };

                    url = `${apiUrl}/users`;
                } else if (action === 'getUsers') {
                    method = 'GET';
					url = `${apiUrl}/users`;
				} else if (action === 'checkUser') {
		            const identifierType = this.getNodeParameter('identifierType', i) as string;
		            const identifierValue = this.getNodeParameter('identifierValue', i) as string;

                    url = identifierType === 'uuid'
                        ? `${apiUrl}/users/${identifierValue}`
                        : `${apiUrl}/users/by-${identifierType}/${identifierValue}`;

                    method = 'GET';

                } else if (action === 'updateUser') {
                	method = 'PATCH';
                	url = `${apiUrl}/users`;

                	const rawUpdateFields = this.getNodeParameter('updateFields', i, '{}');
                	let parsedUpdateFields: object;

                	try {
                		parsedUpdateFields = typeof rawUpdateFields === 'string'
                			? JSON.parse(rawUpdateFields)
                			: rawUpdateFields;
                	} catch (error) {
                		throw new Error('Invalid JSON provided in Update Fields');
                	}
                
                	body = { ...parsedUpdateFields };
                } else if (action === 'deleteUser') {
                	const identifierValue = this.getNodeParameter('identifierValue', i) as string;

                	method = 'DELETE';
                	url = `${apiUrl}/users/${identifierValue}`;

                	const rawUpdateFields = this.getNodeParameter('updateFields', i, '{}');
                	let parsedUpdateFields: object;

                	try {
                		parsedUpdateFields = typeof rawUpdateFields === 'string'
                			? JSON.parse(rawUpdateFields)
                			: rawUpdateFields;
                	} catch (error) {
                		throw new Error('Invalid JSON provided in Update Fields');
                	}
                
                	body = { ...parsedUpdateFields };
                }

				response = await this.helpers.request({
					method,
					url,
					headers,
					body,
					json: true,
				});
			} catch (error: any) {
				response = { error: error.message || error };
			}

			returnData.push({ json: response });
		}

		return [returnData];
	}
}

export default Remnawave;
