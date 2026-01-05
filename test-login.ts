import { prisma } from "./lib/prisma";
import * as argon2 from "argon2";

async function testLogin() {
    const email = "subramaniyam.softwaredeveloper@gmail.com";
    const password = "Password@123";

    console.log("Testing login for:", email);

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (!user) {
        console.log("❌ User not found");
        return;
    }

    console.log("✅ User found:", {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    });

    console.log("\nTesting password verification...");
    const isValid = await argon2.verify(user.passwordHash, password);

    if (isValid) {
        console.log("✅ Password is correct!");
    } else {
        console.log("❌ Password is incorrect");
        console.log("\nTrying to hash the password and compare:");
        const testHash = await argon2.hash(password);
        console.log("Test hash created successfully");
        const testVerify = await argon2.verify(testHash, password);
        console.log("Test verify result:", testVerify);
    }

    await prisma.$disconnect();
}

testLogin().catch(console.error);
