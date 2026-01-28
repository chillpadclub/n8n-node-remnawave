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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Users',
						value: 'users',
					},
					{
						name: 'HWID',
						value: 'hwid',
					},
				],
				default: 'users',
				required: true,
			},

			// ==================== Users Operations ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['users'],
					},
				},
				options: [
					{ name: 'Create User', value: 'createUser' },
					{ name: 'Update User', value: 'updateUser' },
					{ name: 'Get All Users', value: 'getAllUsers' },
					{ name: 'Delete User', value: 'deleteUser' },
					{ name: 'Get User', value: 'getUser' },
					{ name: 'Revoke Subscription', value: 'revokeSubscription' },
					{ name: 'Disable User', value: 'disableUser' },
					{ name: 'Enable User', value: 'enableUser' },
					{ name: 'Reset User Traffic', value: 'resetTraffic' },
				],
				default: 'createUser',
				required: true,
			},

			// ==================== HWID Operations ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['hwid'],
					},
				},
				options: [
					{ name: 'Get User HWID', value: 'getUserHWID' },
					{ name: 'Delete HWID', value: 'deleteHWID' },
					{ name: 'Delete All User HWID', value: 'deleteAllUserHWID' },
					{ name: 'Get All HWID', value: 'getAllHWID' },
				],
				default: 'getUserHWID',
				required: true,
			},

			// ==================== Users Parameters ====================

			// Identifier Type - for getUser
			{
				displayName: 'Identifier Type',
				name: 'identifierType',
				type: 'options',
				options: [
					{ name: 'UUID', value: 'uuid' },
					{ name: 'ID', value: 'id' },
					{ name: 'Username', value: 'username' },
					{ name: 'Telegram ID', value: 'telegram-id' },
					{ name: 'Email', value: 'email' },
				],
				default: 'uuid',
				description: 'Type of identifier to use for locating the user',
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['getUser'],
					},
				},
			},

			// Identifier Value - for getUser
			{
				displayName: 'Identifier Value',
				name: 'identifierValue',
				type: 'string',
				default: '',
				required: true,
				description: 'Value of the identifier',
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['getUser'],
					},
				},
			},

			// User UUID - shared parameter for operations that need UUID
			{
				displayName: 'User UUID',
				name: 'userUuid',
				type: 'string',
				default: '',
				required: true,
				description: 'UUID of the user',
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['updateUser', 'deleteUser', 'revokeSubscription', 'disableUser', 'enableUser', 'resetTraffic'],
					},
				},
			},

			// User Data - for createUser
			{
				displayName: 'User Data',
				name: 'userData',
				type: 'json',
				default: '{}',
				required: true,
				description: 'JSON object with user fields to create',
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['createUser'],
					},
				},
			},

			// Update Data - for updateUser
			{
				displayName: 'Update Data',
				name: 'updateData',
				type: 'json',
				default: '{}',
				required: true,
				description: 'JSON object with user fields to update',
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['updateUser'],
					},
				},
			},

			// Pagination - for getAllUsers
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['getAllUsers'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['getAllUsers'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Start',
				name: 'start',
				type: 'number',
				default: 0,
				description: 'Offset for pagination (number of records to skip)',
				typeOptions: {
					minValue: 0,
				},
				displayOptions: {
					show: {
						resource: ['users'],
						operation: ['getAllUsers'],
					},
				},
			},

			// ==================== HWID Parameters ====================

			// User UUID - shared parameter for HWID operations
			{
				displayName: 'User UUID',
				name: 'userUuid',
				type: 'string',
				default: '',
				required: true,
				description: 'UUID of the user',
				displayOptions: {
					show: {
						resource: ['hwid'],
						operation: ['getUserHWID', 'deleteHWID', 'deleteAllUserHWID'],
					},
				},
			},

			// HWID - for deleteHWID
			{
				displayName: 'HWID',
				name: 'hwid',
				type: 'string',
				default: '',
				required: true,
				description: 'HWID of the device to delete',
				displayOptions: {
					show: {
						resource: ['hwid'],
						operation: ['deleteHWID'],
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
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			let response;
			let method: 'GET' | 'DELETE' | 'PATCH' | 'POST' = 'GET';
			let body: object | undefined = undefined;
			let url = '';

			try {
				if (resource === 'users') {
					// ==================== Users Operations ====================

					if (operation === 'createUser') {
						method = 'POST';
						const rawUserData = this.getNodeParameter('userData', i, '{}');
						const parsedUserData = typeof rawUserData === 'string'
							? JSON.parse(rawUserData)
							: rawUserData;
						body = { ...parsedUserData };
						url = `${apiUrl}/users`;

					} else if (operation === 'updateUser') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'PATCH';
						url = `${apiUrl}/users/${userUuid}`;

						const rawUpdateData = this.getNodeParameter('updateData', i, '{}');
						const parsedUpdateData = typeof rawUpdateData === 'string'
							? JSON.parse(rawUpdateData)
							: rawUpdateData;
						body = { ...parsedUpdateData };

					} else if (operation === 'getAllUsers') {
						method = 'GET';
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const start = this.getNodeParameter('start', i, 0) as number;

						const queryParams: string[] = [];
						queryParams.push(`start=${start}`);

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							queryParams.push(`size=${limit}`);
						}

						url = `${apiUrl}/users?${queryParams.join('&')}`;

					} else if (operation === 'deleteUser') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'DELETE';
						url = `${apiUrl}/users/${userUuid}`;

					} else if (operation === 'getUser') {
						const identifierType = this.getNodeParameter('identifierType', i) as string;
						const identifierValue = this.getNodeParameter('identifierValue', i) as string;

						method = 'GET';
						url = identifierType === 'uuid'
							? `${apiUrl}/users/${identifierValue}`
							: `${apiUrl}/users/by-${identifierType}/${identifierValue}`;

					} else if (operation === 'revokeSubscription') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'POST';
						url = `${apiUrl}/users/${userUuid}/actions/revoke`;
						body = {};

					} else if (operation === 'disableUser') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'POST';
						url = `${apiUrl}/users/${userUuid}/actions/disable`;
						body = {};

					} else if (operation === 'enableUser') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'POST';
						url = `${apiUrl}/users/${userUuid}/actions/enable`;
						body = {};

					} else if (operation === 'resetTraffic') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'POST';
						url = `${apiUrl}/users/${userUuid}/actions/reset-traffic`;
						body = {};

					} else {
						throw new Error(`Unknown users operation: ${operation}`);
					}

				} else if (resource === 'hwid') {
					// ==================== HWID Operations ====================

					if (operation === 'getUserHWID') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'GET';
						url = `${apiUrl}/hwid/devices/${userUuid}`;

					} else if (operation === 'deleteHWID') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						const hwid = this.getNodeParameter('hwid', i) as string;
						method = 'POST';
						url = `${apiUrl}/hwid/devices/delete`;
						body = { userUuid, hwid };

					} else if (operation === 'deleteAllUserHWID') {
						const userUuid = this.getNodeParameter('userUuid', i) as string;
						method = 'DELETE';
						url = `${apiUrl}/hwid/devices/${userUuid}/all`;

					} else if (operation === 'getAllHWID') {
						method = 'GET';
						url = `${apiUrl}/hwid/devices`;

					} else {
						throw new Error(`Unknown hwid operation: ${operation}`);
					}

				} else {
					throw new Error(`Unknown resource: ${resource}`);
				}

				response = await this.helpers.request({
					method,
					url,
					headers,
					body,
					json: true,
				});

			} catch (error: any) {
				if (error.statusCode === 404) {
					throw new Error(`Resource not found: ${error.message || 'Not Found'}`);
				}

				throw new Error(`API Error: ${error.message || error}`);
			}

			if (operation === 'getUserHWID' && response.response && response.response.devices) {
				returnData.push({ json: response.response.devices });
			} else {
				returnData.push({ json: response });
			}
		}
		return [returnData];
	}
}

export default Remnawave;
