/**
 * Environment-Aware API Configuration
 *
 * Handles differences between development and production environments
 * including different WordPress table prefixes and base URLs.
 */

/**
 * Get environment-specific configuration
 * @returns {Object} Configuration object with apiBaseUrl, tablePrefix, and table names
 */
export const getEnvironmentConfig = () => {
  const hostname = window.location.hostname;

  if (hostname === 'christinmorton.local' || hostname.includes('localhost')) {
    // Development environment
    return {
      environment: 'development',
      apiBaseUrl: 'http://christinmorton.local/wp-json',
      tablePrefix: 'wp_jet_cct',
      tables: {
        message: 'wp_jet_cct_message',
        analytics_event: 'wp_jet_cct_analytics_event',
        appointment: 'wp_jet_cct_appointment',
        invoice: 'wp_jet_cct_invoice'
      }
    };
  } else {
    // Production environment
    return {
      environment: 'production',
      apiBaseUrl: 'https://cms.christinmorton.com/wp-json',
      tablePrefix: '4cm_jet_cct',
      tables: {
        message: '4cm_jet_cct_message',
        analytics_event: '4cm_jet_cct_analytics_event',
        appointment: '4cm_jet_cct_appointment',
        invoice: '4cm_jet_cct_invoice'
      }
    };
  }
};

// Get current environment configuration
const config = getEnvironmentConfig();

/**
 * API Endpoints - Environment-aware URLs
 */
export const API_ENDPOINTS = {
  // Custom message submission endpoint (custom PHP endpoint)
  SUBMIT_MESSAGE: `${config.apiBaseUrl}/cmm/v1/submit-message`,

  // Media upload endpoint (custom PHP endpoint)
  MEDIA_UPLOAD: `${config.apiBaseUrl}/cmm/v2/media/upload`,

  // JetEngine Custom Content Type endpoints
  ANALYTICS_EVENT: `${config.apiBaseUrl}/jet-cct/analytics_event`,
  APPOINTMENT: `${config.apiBaseUrl}/jet-cct/appointment`,
  INVOICE: `${config.apiBaseUrl}/jet-cct/invoice`,
  MESSAGE: `${config.apiBaseUrl}/jet-cct/message`,

  // Custom Post Type endpoints (pending production configuration)
  FAQS: `${config.apiBaseUrl}/wp/v2/faqs`,
  DYNAMIC_CARD: `${config.apiBaseUrl}/wp/v2/dynamic_card`,
  DYNAMIC_SECTION: `${config.apiBaseUrl}/wp/v2/dynamic_section`,
  SOCIAL_PROOF: `${config.apiBaseUrl}/wp/v2/social_proof`,
  CASE_STUDY: `${config.apiBaseUrl}/wp/v2/case_study`,
  TESTIMONIAL: `${config.apiBaseUrl}/wp/v2/testimonial`
};

/**
 * Environment information for debugging
 */
export const ENVIRONMENT_INFO = {
  current: config.environment,
  hostname: window.location.hostname,
  apiBaseUrl: config.apiBaseUrl,
  tablePrefix: config.tablePrefix
};

/**
 * Helper function to get table name for current environment
 * @param {string} tableType - Type of table (message, analytics_event, etc.)
 * @returns {string} Full table name for current environment
 */
export const getTableName = (tableType) => {
  return config.tables[tableType] || `${config.tablePrefix}_${tableType}`;
};

/**
 * Helper function to check if we're in development environment
 * @returns {boolean} True if development environment
 */
export const isDevelopment = () => {
  return config.environment === 'development';
};

/**
 * Helper function to check if we're in production environment
 * @returns {boolean} True if production environment
 */
export const isProduction = () => {
  return config.environment === 'production';
};

// Log environment information for debugging
console.log('🌍 API Environment Configuration:', ENVIRONMENT_INFO);

export default {
  getEnvironmentConfig,
  API_ENDPOINTS,
  ENVIRONMENT_INFO,
  getTableName,
  isDevelopment,
  isProduction
};