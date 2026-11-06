/**
 * Embed mode (Story 49): set by /embed/<tool>. Calculators render without
 * site chrome, ads, donation links, or tracking, and the page is noindex.
 */
export const useEmbed = () => useState('embed-mode', () => false);
