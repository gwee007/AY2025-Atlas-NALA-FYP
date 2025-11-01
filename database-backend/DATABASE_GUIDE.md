# How to Add Tables to Your Database

## ✅ Your Database is Ready!
You now have 3 example tables: `users`, `posts`, and `comments`

## 🔧 How to Add New Tables

### Step 1: Define Models in `prisma/schema.prisma`

```prisma
model YourModelName {
  // Primary key (required)
  id        Int      @id @default(autoincrement())
  
  // Your fields
  name      String
  email     String   @unique
  age       Int?     // Optional field
  isActive  Boolean  @default(true)
  
  // Timestamps (recommended)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations (if needed)
  // posts     Post[]
  
  // Table name mapping (optional)
  @@map("your_table_name")
}
```

### Step 2: Create and Apply Migration
```bash
npx prisma migrate dev --name add_your_table_name
```

### Step 3: Update Client (if needed)
```bash
npx prisma generate
```

## 📝 Common Field Types

| Prisma Type | PostgreSQL Type | Example |
|-------------|-----------------|---------|
| `String`    | TEXT/VARCHAR    | `name String` |
| `Int`       | INTEGER         | `age Int` |
| `BigInt`    | BIGINT          | `largeNumber BigInt` |
| `Float`     | DOUBLE PRECISION| `price Float` |
| `Decimal`   | DECIMAL         | `money Decimal` |
| `Boolean`   | BOOLEAN         | `isActive Boolean` |
| `DateTime`  | TIMESTAMP       | `createdAt DateTime` |
| `Json`      | JSONB           | `metadata Json` |
| `Bytes`     | BYTEA           | `file Bytes` |

## 🔗 Relationship Examples

```prisma
// One-to-Many
model User {
  id    Int    @id @default(autoincrement())
  posts Post[] // One user has many posts
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}

// Many-to-Many
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[] @relation("PostTags")
}

model Tag {
  id    Int    @id @default(autoincrement())
  posts Post[] @relation("PostTags")
}

// One-to-One
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int  @id @default(autoincrement())
  userId Int  @unique
  user   User @relation(fields: [userId], references: [id])
}
```

## 🛠 Useful Commands

- `npx prisma db push` - Push schema changes without migration (for prototyping)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma migrate reset` - Reset database and apply all migrations
- `npx prisma studio` - Open visual database browser
- `npx prisma generate` - Regenerate Prisma Client
- `npx prisma db seed` - Run seed file (if configured)

## 💡 Tips

1. **Always backup** your data before major schema changes
2. **Use migrations** (`migrate dev`) for production-ready changes
3. **Use `db push`** only for quick prototyping
4. **Add indexes** for frequently queried fields:
   ```prisma
   model User {
     email String @unique
     name  String
     
     @@index([name])
   }
   ```
5. **Use enums** for fixed value sets:
   ```prisma
   enum Role {
     USER
     ADMIN
     MODERATOR
   }
   
   model User {
     role Role @default(USER)
   }
   ```

Ready to add your own tables! 🚀