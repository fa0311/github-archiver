export const placeholder = (input: string, placeholders: Record<string, string>) => {
	return Object.entries(placeholders).reduce(
		(result, [key, value]) => result.replace(`{${key}}`, value),
		input,
	);
};
