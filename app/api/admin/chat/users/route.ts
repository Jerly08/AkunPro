import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import mysql from 'mysql2/promise';

// Helper to get DB connection
async function getConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'netflix_spotify_marketplace'
  });
}

// GET /api/admin/chat/users - Fetch users with chat messages
export async function GET(request: NextRequest) {
  console.log('[SERVER DEBUG] GET /api/admin/chat/users - Starting request');
  try {
    const session = await getServerSession(authOptions);
    console.log('[SERVER DEBUG] Session:', session?.user?.role);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Try Prisma first
    try {
      // @ts-ignore - We're checking if it exists at runtime
      if (prisma.chatMessage) {
        // Get distinct users that have sent chat messages
        const users = await prisma.user.findMany({
          where: {
            chatMessages: {
              some: {} // Any user with at least one chat message
            }
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            chatMessages: {
              where: {
                isRead: false,
                isFromAdmin: false // Only count unread messages from users, not admins
              }
            }
          },
          orderBy: {
            chatMessages: {
              _count: 'desc' // Order by number of chat messages
            }
          }
        });

        // Transform data to include unread count
        const formattedUsers = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          // @ts-ignore - We know chatMessages exists because of the where condition
          unreadCount: user.chatMessages.length
        }));

        return NextResponse.json({
          success: true,
          users: formattedUsers
        });
      }
    } catch (prismaError) {
      console.log('[SERVER DEBUG] Prisma client not available, falling back to direct MySQL');
    }

    // Fallback to MySQL
    const connection = await getConnection();
    
    // First get all users that have messages
    const [distinctUserRows] = await connection.execute(`
      SELECT DISTINCT u.id, u.name, u.email, u.image
      FROM users u
      INNER JOIN chat_messages cm ON u.id = cm.userId
      ORDER BY u.name
    `);
    
    console.log('[SERVER DEBUG] Distinct users with messages:', distinctUserRows);
    
    const formattedUsers = [];
    
    // For each user, get their unread count
    for (const user of distinctUserRows as any[]) {
      const [countRows] = await connection.execute(`
        SELECT COUNT(*) as unreadCount
        FROM chat_messages
        WHERE userId = ? AND isRead = 0 AND isFromAdmin = 0
      `, [user.id]);
      
      formattedUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        unreadCount: (countRows as any[])[0].unreadCount
      });
    }
    
    // If no users have messages, return all users
    if (formattedUsers.length === 0) {
      const [allUsers] = await connection.execute(`
        SELECT id, name, email, image 
        FROM users 
        WHERE role = 'USER'
        ORDER BY name
      `);
      
      formattedUsers.push(...(allUsers as any[]).map(user => ({
        ...user,
        unreadCount: 0
      })));
    }
    
    await connection.end();
    
    return NextResponse.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error("[SERVER DEBUG] Error fetching chat users:", error);
    return NextResponse.json({
      success: true,
      users: [],
      error: "Chat service temporarily unavailable"
    });
  }
} 