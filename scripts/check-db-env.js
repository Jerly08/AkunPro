#!/usr/bin/env node

/**
 * This script checks that all necessary database environment variables 
 * are set correctly and provides guidance on configuration issues.
 */

require('dotenv').config();

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}AkunPro Database Environment Variables Check${RESET}\n`);

// Define required variables to check
const requiredVars = [
  {
    name: 'DATABASE_URL',
    description: 'Prisma database connection URL',
    required: true
  },
  {
    name: 'DATABASE_HOST',
    description: 'Database server hostname',
    required: false,
    defaultValue: 'localhost'
  },
  {
    name: 'DATABASE_PORT',
    description: 'Database server port',
    required: false,
    defaultValue: '3306'
  },
  {
    name: 'DATABASE_NAME',
    description: 'Database name',
    required: false,
    defaultValue: 'netflix_spotify_marketplace'
  },
  {
    name: 'DATABASE_USER',
    description: 'Database username',
    required: false,
    defaultValue: 'root'
  },
  {
    name: 'DATABASE_PASSWORD',
    description: 'Database password',
    required: false,
    defaultValue: ''
  }
];

let hasErrors = false;
let hasWarnings = false;

console.log(`${BOLD}Checking database configuration...${RESET}\n`);

// Check each variable
requiredVars.forEach(variable => {
  const value = process.env[variable.name];
  
  if (!value && variable.required) {
    console.log(`${RED}✗ ${variable.name}${RESET}: Not set (REQUIRED)`);
    console.log(`  Description: ${variable.description}`);
    hasErrors = true;
  } else if (!value && !variable.required) {
    console.log(`${YELLOW}⚠ ${variable.name}${RESET}: Not set (using default: "${variable.defaultValue}")`);
    hasWarnings = true;
  } else {
    // For security, don't show actual values of sensitive fields
    if (variable.name.includes('PASSWORD') || variable.name.includes('URL')) {
      console.log(`${GREEN}✓ ${variable.name}${RESET}: Set (value hidden for security)`);
    } else {
      console.log(`${GREEN}✓ ${variable.name}${RESET}: ${value}`);
    }
  }
});

// Check if DATABASE_URL is valid
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`\n${BOLD}Parsed DATABASE_URL:${RESET}`);
    console.log(`  Protocol: ${url.protocol.replace(':', '')}`);
    console.log(`  Host: ${url.hostname}`);
    console.log(`  Port: ${url.port || '3306 (default)'}`);
    console.log(`  Database: ${url.pathname.substring(1)}`);
    console.log(`  Username: ${url.username || 'none'}`);
    console.log(`  Password: ${url.password ? '(set)' : 'none'}`);
  } catch (e) {
    console.log(`\n${RED}✗ DATABASE_URL is not a valid URL${RESET}`);
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '-'.repeat(50));
if (hasErrors) {
  console.log(`${RED}${BOLD}✗ Some required environment variables are missing${RESET}`);
  console.log('Please set the missing variables in your .env file or environment');
} else if (hasWarnings) {
  console.log(`${YELLOW}${BOLD}⚠ Configuration complete with warnings${RESET}`);
  console.log('Your application will use default values for missing variables');
} else {
  console.log(`${GREEN}${BOLD}✓ All database environment variables are properly configured${RESET}`);
}

// Exit with appropriate code
process.exit(hasErrors ? 1 : 0); 