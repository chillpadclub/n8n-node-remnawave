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
		icon: 'fa:globe',
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
					{ name: 'Get HWID', value: 'getHWID' },
					{ name: 'Delete HWID', value: 'deleteHWID' },
					{ name: 'Revoke Subscription', value: 'revokeSubscription' },
				],
				default: 'createUser',
				required: true,
			},

			{
			  displayName: 'User UUID',
			  name: 'revokeUuid',
			  type: 'string',
			  default: '',
			  required: true,
			  description: 'UUID of the user to revoke subscription for',
			  displayOptions: {
			    show: {
			      action: ['revokeSubscription'],
			    },
			  },
			},

			// Для checkUser и deleteUser
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
				description: 'UUID or other identifier of the user',
				displayOptions: {
					show: {
						action: ['checkUser'],
					},
				},
			},
			{
				displayName: 'User UUID',
				name: 'identifierValue',
				type: 'string',
				default: '',
				required: true,
				description: 'UUID пользователя для удаления',
				displayOptions: {
					show: {
						action: ['deleteUser'],
					},
				},
			},
			// Для updateUser
			{
				displayName: 'User UUID',
				name: 'updateUuid',
				type: 'string',
				default: '',
				required: true,
				description: 'UUID of the user to update',
				displayOptions: {
					show: {
						action: ['updateUser'],
					},
				},
			},
			// Для updateUser и createUser
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'json',
				default: '{}',
				required: true,
				description: 'JSON object with user fields to create or update',
				displayOptions: {
					show: {
						action: ['updateUser', 'createUser'],
					},
				},
			},

			// Для обоих действий нужен userUuid
			{
				displayName: 'User UUID',
				name: 'userUuid',
				type: 'string',
				default: '',
				required: true,
				description: 'UUID пользователя',
				displayOptions: {
					show: {
						action: ['getHWID', 'deleteHWID'],
					},
				},
			},

			// Для deleteHWID — нужен ещё hwid
			{
				displayName: 'HWID',
				name: 'hwid',
				type: 'string',
				default: '',
				required: true,
				description: 'HWID устройства для удаления',
				displayOptions: {
					show: {
						action: ['deleteHWID'],
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
			let method: 'GET' | 'DELETE' | 'PATCH' | 'POST' = 'GET';
			let body: object | undefined = undefined;
			let url = '';

			// Для обработки ошибок
			let identifierType = '';
			let identifierValue = '';

			try {
				if (action === 'createUser') {
					method = 'POST';
					const rawUpdateFields = this.getNodeParameter('updateFields', i, '{}');
					const parsedUpdateFields = typeof rawUpdateFields === 'string'
						? JSON.parse(rawUpdateFields)
						: rawUpdateFields;
					body = { ...parsedUpdateFields };
					url = `${apiUrl}/users`;

				} else if (action === 'getUsers') {
					method = 'GET';
					url = `${apiUrl}/users`;

				} else if (action === 'checkUser') {
					identifierType = this.getNodeParameter('identifierType', i) as string;
					identifierValue = this.getNodeParameter('identifierValue', i) as string;

					url = identifierType === 'uuid'
						? `${apiUrl}/users/${identifierValue}`
						: `${apiUrl}/users/by-${identifierType}/${identifierValue}`;

					method = 'GET';

				} else if (action === 'updateUser') {
					const uuid = this.getNodeParameter('updateUuid', i) as string;
					identifierValue = uuid;

					method = 'PATCH';
					url = `${apiUrl}/users/${uuid}`;

					const rawUpdateFields = this.getNodeParameter('updateFields', i, '{}');
					const parsedUpdateFields = typeof rawUpdateFields === 'string'
						? JSON.parse(rawUpdateFields)
						: rawUpdateFields;

					body = { ...parsedUpdateFields };

				} else if (action === 'deleteUser') {
					const uuid = this.getNodeParameter('deleteIdentifierValue', i) as string;
					identifierValue = uuid;

					method = 'DELETE';
					url = `${apiUrl}/users/${uuid}`;
				} else if (action === 'getHWID') {
					method = 'GET';
					const userUuid = this.getNodeParameter('userUuid', i) as string;
					url = `${apiUrl}/hwid/devices/${userUuid}`;

				} else if (action === 'deleteHWID') {
					method = 'POST';
					url = `${apiUrl}/hwid/devices/delete`;

					const userUuid = this.getNodeParameter('userUuid', i) as string;
					const hwid = this.getNodeParameter('hwid', i) as string;

					body = { userUuid, hwid };

				} else if (action === 'revokeSubscription') {
					method = 'POST';
					const uuid = this.getNodeParameter('revokeUuid', i) as string;
					identifierValue = uuid;
					url = `${apiUrl}/users/${uuid}/actions/revoke`;
					body = {};
				} else {
				    throw new Error(`Unknown action: ${action}`);
				}
				response = await this.helpers.request({
					method,
					url,
					headers,
					body,
					json: true,
				});
			} catch (error: any) {
				// Обработка ошибок 404 по каждому действию
				if (error.statusCode === 404) {
					if (action === 'checkUser') {
						throw new Error(`User not found with ${identifierType}: ${identifierValue}`);
					} else if (action === 'updateUser' || action === 'deleteUser' || action === 'revokeSubscription') {
						throw new Error(`User not found with UUID: ${identifierValue}`);
					}
				}

				// Общая ошибка
				throw new Error(`API Error: ${error.message || error}`);
			}

			if (action === 'getHWID' && response.response && response.response.devices) {
				returnData.push({ json: response.response.devices });
			} else {
				returnData.push({ json: response });
			}
		}
	return [returnData];
	}
}

export default Remnawave;
