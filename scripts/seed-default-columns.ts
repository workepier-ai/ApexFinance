import { db } from "../server/db";
import { columnConfigurations, banks } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function seedDefaultColumns() {
  try {
    const userId = 'mock-user-id';

    console.log('🌱 Seeding default column configurations...');

    // Get all banks for the user
    const userBanks = await db.select()
      .from(banks)
      .where(eq(banks.userId, userId));

    console.log(`Found ${userBanks.length} banks for user`);

    // Default columns to create
    const defaultColumns = [
      { name: 'Spending', order: 0 },
      { name: 'Bills', order: 1 },
      { name: 'Savers', order: 2 },
    ];

    for (const bank of userBanks) {
      console.log(`\nProcessing bank: ${bank.name} (${bank.bankType})`);

      for (const column of defaultColumns) {
        // Check if column already exists
        const existing = await db.select()
          .from(columnConfigurations)
          .where(and(
            eq(columnConfigurations.userId, userId),
            eq(columnConfigurations.bankId, bank.id),
            eq(columnConfigurations.columnName, column.name)
          ))
          .limit(1);

        if (existing.length > 0) {
          console.log(`  ⏭️  Column "${column.name}" already exists`);
          continue;
        }

        // Create the column configuration
        await db.insert(columnConfigurations).values({
          userId,
          bankId: bank.id,
          columnName: column.name,
          displayOrder: column.order,
          isDefault: true,
        });

        console.log(`  ✅ Created column "${column.name}"`);
      }
    }

    // Also create default columns with bankId=null for global defaults
    console.log('\n📋 Creating global default columns...');
    for (const column of defaultColumns) {
      const existing = await db.select()
        .from(columnConfigurations)
        .where(and(
          eq(columnConfigurations.userId, userId),
          eq(columnConfigurations.columnName, column.name)
        ))
        .limit(1);

      if (existing.some(col => col.bankId === null)) {
        console.log(`  ⏭️  Global column "${column.name}" already exists`);
        continue;
      }

      await db.insert(columnConfigurations).values({
        userId,
        bankId: null,
        columnName: column.name,
        displayOrder: column.order,
        isDefault: true,
      });

      console.log(`  ✅ Created global column "${column.name}"`);
    }

    console.log('\n✨ Default columns seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding default columns:', error);
    process.exit(1);
  }
}

seedDefaultColumns();
