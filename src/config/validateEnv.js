/**
 * Environment Variables Validation
 * Ensures all required environment variables are set before the application starts
 */

const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
const optionalVars = ['CORS_ORIGIN', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

const validateEnv = () => {
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  optionalVars.forEach(v => {
    if (!process.env[v]) {
      console.warn(`⚠️  Optional env var "${v}" not set`);
    }
  });
  
  console.log('✅ Environment validation passed');
};

module.exports = validateEnv;
