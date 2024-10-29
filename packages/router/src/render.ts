/**
 * Helper function to render HTML
 * @param html - The HTML string to render
 * @returns A Response object with the HTML string
 */
export function render(html: string): Response {
	return new Response(html, {
		status: 200,
		headers: {
			"content-type": "text/html; charset=UTF-8",
		},
	});
}