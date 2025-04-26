import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import getDatabaseConnection from '@/lib/db-connect';

// Helper to get DB connection
async function getConnection() {
  return await getDatabaseConnection();
}

// GET /api/admin/chat/messages?userId={userId} - Fetch messages for a specific user
export async function GET(request: NextRequest) {
  console.log('[SERVER DEBUG] GET /api/admin/chat/messages - Starting request');
  try {
    const session = await getServerSession(authOptions);
    console.log('[SERVER DEBUG] Session:', session?.user?.role);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    console.log('[SERVER DEBUG] Fetching messages for userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Try using Prisma first
    try {
      // @ts-ignore - We're checking if it exists at runtime
      if (prisma.chatMessage) {
        // Get messages for this user
        // @ts-ignore - We've confirmed chatMessage exists
        const messages = await prisma.chatMessage.findMany({
          where: {
            userId: userId
          },
          orderBy: {
            createdAt: "asc"
          }
        });

        return NextResponse.json({
          success: true,
          messages: messages.map((msg: any) => ({
            ...msg,
            createdAt: msg.createdAt.toISOString()
          }))
        });
      }
    } catch (prismaError) {
      console.log('[SERVER DEBUG] Prisma client not available, falling back to direct MySQL');
    }

    // Fallback to MySQL connection
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC',
      [userId]
    );
    await connection.end();

    console.log('[SERVER DEBUG] Fetched messages with MySQL, count:', (rows as any[]).length);

    return NextResponse.json({
      success: true,
      messages: (rows as any[]).map(row => ({
        id: row.id,
        userId: row.userId,
        content: row.content,
        isRead: Boolean(row.isRead),
        isFromAdmin: Boolean(row.isFromAdmin),
        createdAt: row.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("[SERVER DEBUG] Error fetching chat messages:", error);
    return NextResponse.json({
      success: true,
      messages: [],
      error: "Chat service temporarily unavailable"
    });
  }
} 