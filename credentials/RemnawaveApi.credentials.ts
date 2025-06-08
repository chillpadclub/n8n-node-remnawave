import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RemnawaveApi implements ICredentialType {
	name = 'remnawaveApi';
	displayName = 'Remnawave API';
	documentationUrl = ''; // можно указать если есть
	properties: INodeProperties[] = [
		{
			displayName: 'API URL',
			name: 'url',
			type: 'string',
			default: 'https://remna.st/api',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
		},
	];
}

export default RemnawaveApi;
