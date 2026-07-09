/**
 * IndexNow Utility for InfinityForge.tech
 * Notifies search engines when content has been updated
 */

class IndexNow {
    constructor() {
        this.host = 'infinityforge.tech';
        this.key = '70a3364b72e84d8aa8691edd2f1d406a';
        this.keyLocation = `https://${this.host}/${this.key}.txt`;
        this.apiUrl = 'https://api.indexnow.org/indexnow';
    }

    /**
     * Notify IndexNow of updated URLs
     * @param {string[]} urls - Array of URLs that have been updated
     * @returns {Promise} - Promise that resolves with the response
     */
    async notify(urls) {
        // Ensure all URLs are absolute and belong to our domain
        const validUrls = urls.filter(url => {
            try {
                const urlObj = new URL(url);
                return urlObj.hostname === this.host || urlObj.hostname === `www.${this.host}`;
            } catch {
                return false;
            }
        });

        if (validUrls.length === 0) {
            throw new Error('No valid URLs provided for this domain');
        }

        const payload = {
            host: this.host,
            key: this.key,
            keyLocation: this.keyLocation,
            urlList: validUrls
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`IndexNow API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('IndexNow notification successful:', result);
            return result;

        } catch (error) {
            console.error('IndexNow notification failed:', error);
            throw error;
        }
    }

    /**
     * Notify IndexNow of a single updated URL
     * @param {string} url - URL that has been updated
     * @returns {Promise} - Promise that resolves with the response
     */
    async notifySingle(url) {
        return this.notify([url]);
    }

    /**
     * Get all URLs from the sitemap (for bulk notifications)
     * @returns {string[]} - Array of all URLs from sitemap
     */
    getAllUrls() {
        // This would need to be updated if your sitemap structure changes
        return [
            `https://${this.host}/`,
            `https://${this.host}/about.html`,
            `https://${this.host}/features.html`,
            `https://${this.host}/privacy.html`,
            `https://${this.host}/terms.html`,
            `https://${this.host}/imageresizer.html`,
            `https://${this.host}/imagecompressor.html`,
            `https://${this.host}/imageconverter.html`,
            `https://${this.host}/imageenhancement.html`,
            `https://${this.host}/imagefilters.html`,
            `https://${this.host}/imagecolortools.html`,
            `https://${this.host}/pdfconverter.html`,
            `https://${this.host}/pdf-compressor.html`,
            `https://${this.host}/pdf-editor.html`,
            `https://${this.host}/pdf-translator.html`,
            `https://${this.host}/pdftools.html`,
            `https://${this.host}/document-converter.html`,
            `https://${this.host}/ocr.html`,
            `https://${this.host}/socialmedia.html`,
            `https://${this.host}/imageanalysis.html`,
            `https://${this.host}/qrcode-generator.html`
        ];
    }

    /**
     * Notify IndexNow of all pages (useful for site-wide updates)
     * @returns {Promise} - Promise that resolves with the response
     */
    async notifyAll() {
        const allUrls = this.getAllUrls();
        return this.notify(allUrls);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexNow;
}

// Global instance for browser use
if (typeof window !== 'undefined') {
    window.IndexNow = IndexNow;
}