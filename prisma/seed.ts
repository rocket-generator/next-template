import { PrismaClient } from "../src/generated/prisma";
import { hashPassword } from "../src/libraries/hash";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Delete existing credential accounts before recreating users
  await prisma.account.deleteMany({
    where: {
      providerId: "credential",
    },
  });
  console.log("Deleted existing credential accounts");

  // Delete existing users
  await prisma.user.deleteMany();
  console.log("Deleted existing users");

  // Create users with different roles
  const users = [
    {
      email: "admin@example.com",
      password: "password",
      name: "管理者ユーザー",
      permissions: ["admin"],
      isActive: true,
      emailVerified: true,
    },
    {
      email: "user@example.com",
      password: "password",
      name: "一般ユーザー",
      permissions: [],
      isActive: true,
      emailVerified: true,
    },
  ];

  for (const userData of users) {
    const hashedPassword = await hashPassword(userData.password);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        permissions: userData.permissions,
        isActive: userData.isActive,
        emailVerified: userData.emailVerified,
      },
    });
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: userData.email.toLowerCase(),
        password: hashedPassword,
      },
    });
    console.log(
      `Created user: ${user.email} with permissions: ${JSON.stringify(
        userData.permissions
      )}`
    );
  }

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
