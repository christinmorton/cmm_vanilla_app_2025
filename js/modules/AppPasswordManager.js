/**
 * WordPress Application Password Authentication Manager
 * Handles secure authentication for WordPress REST API using Application Passwords
 */
class AppPasswordManager {
    constructor(config = {}) {
        this.apiBaseUrl = config.apiBaseUrl || this.getEnvironmentApiUrl();
        this.appUser = __WORDPRESS_APP_USER__;
        this.appPassword = __WORDPRESS_APP_PASSWORD__;
        
        // Validate credentials are available
        if (!this.appUser || !this.appPassword) {
            throw new Error('WordPress Application Password credentials not found in environment variables');
        }
    }

    /**
     * Get environment-specific API URL
     */
    getEnvironmentApiUrl() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('localhost') || hostname.includes('.local')) {
            return __WORDPRESS_API_BASE_DEV__ || 'http://christinmorton.local/wp-json';
        }
        
        return __WORDPRESS_API_BASE_PROD__ || 'https://cms.christinmorton.com/wp-json';
    }

    /**
     * Initialize app authentication (always ready with Application Passwords)
     */
    async initialize() {
        // Application passwords don't need initialization - they're always ready
        return this.testCredentials();
    }

    /**
     * Test Application Password credentials
     */
    async testCredentials() {
        try {
            const response = await this.makeRequest(`${this.apiBaseUrl}/wp/v2/users/me`);
            return response.ok;
        } catch (error) {
            console.error('Application Password test failed:', error);
            return false;
        }
    }

    /**
     * Get Basic Auth credentials (Base64 encoded)
     */
    getEncodedCredentials() {
        const credentials = `${this.appUser}:${this.appPassword}`;
        return btoa(credentials);
    }

    /**
     * Get authentication headers for requests
     */
    getAuthHeaders() {
        return {
            'Authorization': `Basic ${this.getEncodedCredentials()}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make authenticated API request with Application Password
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const authenticatedOptions = {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...(options.headers || {})
                }
            };

            const response = await fetch(endpoint, authenticatedOptions);
            
            // Handle authentication errors
            if (response.status === 401) {
                console.error('Application Password authentication failed. Check credentials in .env file');
                throw new Error('Application Password authentication failed');
            }
            
            return response;
            
        } catch (error) {
            console.error('Authenticated request failed:', error);
            throw error;
        }
    }

    /**
     * Get current environment
     */
    getEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname.includes('localhost') || hostname.includes('.local')) {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('dev.')) {
            return 'staging';
        }
        
        return 'production';
    }

    /**
     * Submit analytics event with authentication
     */
    async submitAnalyticsEvent(eventData) {
        try {
            const response = await this.makeRequest(
                `${this.apiBaseUrl}/jet-cct/analytics_event`,
                {
                    method: 'POST',
                    body: JSON.stringify(eventData)
                }
            );

            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`Analytics submission failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error('Analytics submission error:', error);
            // Fail silently to not impact user experience
            return null;
        }
    }

    /**
     * Submit contact message with authentication
     */
    async submitMessage(messageData) {
        try {
            const response = await this.makeRequest(
                `${this.apiBaseUrl}/cmm/v1/submit-message`,
                {
                    method: 'POST',
                    body: JSON.stringify(messageData)
                }
            );

            if (response.ok) {
                return await response.json();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.errors ? errorData.errors.join(', ') : 'Message submission failed');
            }
            
        } catch (error) {
            console.error('Message submission error:', error);
            throw error;
        }
    }
}

export default AppPasswordManager;