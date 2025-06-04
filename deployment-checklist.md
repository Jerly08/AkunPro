# AkunPro Deployment Checklist

Use this checklist to track your deployment progress:

## Pre-Deployment

- [ ] Ensure all changes are committed to your GitHub repository
- [ ] Verify your application works locally with the database
- [ ] Check that your package.json has all the necessary dependencies
- [ ] Verify Prisma schema and database migrations
- [ ] Test the application with the seed data

## Railway Database Deployment

- [ ] Sign up/login to [Railway](https://railway.app/)
- [ ] Create new project with MySQL
- [ ] Save the MySQL connection string
- [ ] Record all database credentials (host, port, username, password, name)
- [ ] Update your local .env with Railway connection string
- [ ] Run `npx prisma migrate deploy` to apply migrations
- [ ] Run `npm run prisma:seed` to populate the database
- [ ] Test the connection to the Railway database

## Vercel Frontend Deployment

- [ ] Sign up/login to [Vercel](https://vercel.com/)
- [ ] Connect your GitHub account to Vercel
- [ ] Import your repository
- [ ] Configure the build settings
- [ ] Set up all required environment variables:
  - [ ] DATABASE_URL
  - [ ] DATABASE_HOST
  - [ ] DATABASE_USER
  - [ ] DATABASE_PASSWORD
  - [ ] DATABASE_NAME
  - [ ] DATABASE_PORT
  - [ ] NEXTAUTH_URL
  - [ ] NEXTAUTH_SECRET
  - [ ] NODE_ENV
- [ ] Deploy the application
- [ ] Test the deployed application

## Post-Deployment

- [ ] Verify login functionality
- [ ] Check if products are displaying correctly
- [ ] Test the checkout process
- [ ] Verify admin dashboard functionality
- [ ] Check all API endpoints
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)

## Security Checklist

- [ ] Use strong, unique passwords for all services
- [ ] Ensure all environment variables are properly set
- [ ] Don't store sensitive information in the code
- [ ] Keep all dependencies updated
- [ ] Set up monitoring for your application 