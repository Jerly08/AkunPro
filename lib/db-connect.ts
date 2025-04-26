import mysql from 'mysql2/promise';

/**
 * Helper function to create a MySQL database connection using environment variables.
 * Falls back to default values if environment variables are not set.
 */
export async function getDatabaseConnection() {
  return await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'netflix_spotify_marketplace'
  });
}

/**
 * Executes a database query with proper error handling
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function executeQuery(query: string, params: any[] = []) {
  const connection = await getDatabaseConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

export default getDatabaseConnection; 