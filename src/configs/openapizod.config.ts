export const openApiZodConfig = {
	input: './openapi.yaml',
	output: './src/generated/api-schema.ts',
	template: 'hono',
	// Các tùy chọn khác (tùy chọn):
	// baseUrl: 'https://api.example.com',
	// withAlias: false,
	// exportSchemas: true,
	// withDeprecated: false,
	// groupStrategy: 'none' as const, // 'none' | 'tag' | 'method' | 'tag-file' | 'method-file'
};
