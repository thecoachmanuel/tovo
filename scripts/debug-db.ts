
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  try {
    const meetings = await db.meeting.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Meetings found:', meetings.length);
    meetings.forEach((m: any) => {
      console.log(`- ID: ${m.id}, Title: ${m.title}, StartsAt: ${m.startsAt}, StreamCallId: ${m.streamCallId}, CreatedBy: ${m.createdBy}`);
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
