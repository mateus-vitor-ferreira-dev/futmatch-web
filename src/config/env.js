/**
 * Variáveis de ambiente do frontend.
 *
 * Configure no .env local:
 *   VITE_API_URL           — URL base da API (padrão: http://localhost:3000)
 *   VITE_GOOGLE_CLIENT_ID  — Client ID do Google OAuth
 */
export const env = {
  apiUrl:           import.meta.env.VITE_API_URL                 || 'http://localhost:3000',
  googleClientId:   import.meta.env.VITE_GOOGLE_CLIENT_ID        || '',
  cloudinaryCloud:  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   || '',
  cloudinaryPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
}
