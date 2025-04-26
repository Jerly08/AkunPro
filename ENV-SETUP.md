# Environment Variables Setup

This document explains how to set up environment variables for the AkunPro marketplace application, both in development and production environments.

## Required Environment Variables

The application requires the following environment variables to be set:

### Database Configuration

```
# Prisma database URL
DATABASE_URL="mysql://user:password@host:port/database_name"

# Direct database connection (used for fallback)
DATABASE_HOST="localhost"
DATABASE_USER="root"
DATABASE_PASSWORD=""
DATABASE_NAME="netflix_spotify_marketplace"
DATABASE_PORT="3306"
```

### MySQL Binary Paths (for database migration scripts)
```
# Optional - Only needed if running database migration scripts
MYSQL_PATH="c:\\xampp\\mysql\\bin\\mysql.exe"  # Windows path to MySQL binary
MYSQLADMIN_PATH="c:\\xampp\\mysql\\bin\\mysqladmin.exe"  # Windows path to MySQL Admin binary
```

### NextAuth Configuration

```
NEXTAUTH_URL="http://localhost:3000"  # Development
NEXTAUTH_URL="https://your-production-domain.com"  # Production
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

### Email Configuration (for password reset, etc)

```
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
```

### Other App Settings

```
NODE_ENV="development"  # or "production"
```

## Setting Up For Development

1. Create a `.env` file in the root directory of the project
2. Copy the variables above and set their values according to your development environment
3. Make sure your MySQL server is running with the appropriate credentials and database

## Setting Up For Production

### Regular Hosting

1. Set the environment variables in your hosting provider's dashboard (Vercel, Netlify, etc.)
2. Make sure to update `NEXTAUTH_URL` to your production domain
3. Set `NODE_ENV` to "production"

### Docker Deployment

If deploying with Docker:

1. Create a `.env.production` file with your production settings
2. Use the `--env-file` option when starting your Docker container:
   ```
   docker run --env-file .env.production your-image-name
   ```

### Database Connection String Format

The Prisma database URL follows this format:
```
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
```

For example:
```
DATABASE_URL="mysql://dbuser:securepassword@database.example.com:3306/akunpro_prod"
```

## Security Considerations

- Never commit `.env` files to your repository
- Use different passwords for development and production
- For production, use strong, randomly generated passwords
- Regularly rotate your database credentials

## Troubleshooting

If you encounter database connection issues:

1. Check that your environment variables are set correctly
2. Verify that your database server is running and accessible
3. Ensure the database user has appropriate permissions
4. Check the application logs for specific error messages 