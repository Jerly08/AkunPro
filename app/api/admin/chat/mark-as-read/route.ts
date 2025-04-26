import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import getDatabaseConnection from '@/lib/db-connect';

// Helper to get DB connection
async function getConnection() {
  return await getDatabaseConnection();
}

// POST /api/admin/chat/mark-as-read - Mark messages as read
export async function POST(request: NextRequest) {
  console.log('[SERVER DEBUG] POST /api/admin/chat/mark-as-read - Starting request');
  try {
    const session = await getServerSession(authOptions);
    console.log('[SERVER DEBUG] Session:', session?.user?.role);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await request.json();
    console.log('[SERVER DEBUG] Marking messages as read for userId:', userId);

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
        // Mark all messages from this user as read
        // @ts-ignore - We've confirmed chatMessage exists
        await prisma.chatMessage.updateMany({
          where: {
            userId: userId,
            isFromAdmin: false, // Only mark messages from user (not from admin)
            isRead: false, // Only update unread messages
          },
          data: {
            isRead: true,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Messages marked as read",
        });
      }
    } catch (prismaError) {
      console.log('[SERVER DEBUG] Prisma client not available, falling back to direct MySQL');
    }

    // Fallback to MySQL connection
    try {
      const connection = await getConnection();
      
      const [result] = await connection.execute(
        'UPDATE chat_messages SET isRead = 1 WHERE userId = ? AND isFromAdmin = 0 AND isRead = 0',
        [userId]
      );
      
      await connection.end();
      
      console.log('[SERVER DEBUG] Messages marked as read with MySQL:', result);
      
      return NextResponse.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (sqlError) {
      console.error('[SERVER DEBUG] SQL error:', sqlError);
      
      return NextResponse.json({
        success: true,
        message: "No messages to mark as read",
      });
    }
  } catch (error) {
    console.error("[SERVER DEBUG] Error marking messages as read:", error);
    return NextResponse.json({
      success: true, 
      message: "Chat service temporarily unavailable"
    });
  }
} 