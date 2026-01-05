import { PrismaClient, UserRole, CycleType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting database seed...");

    // Create initial Admin user
    const adminPassword = "Admin@123";
    const adminPasswordHash = await bcrypt.hashSync(adminPassword, 12);

    const admin = await prisma.user.upsert({
        where: { email: "admin@performancemgmt.com" },
        update: {},
        create: {
            name: "System Administrator",
            email: "admin@performancemgmt.com",
            passwordHash: adminPasswordHash,
            role: UserRole.ADMIN,
            status: "ACTIVE",
        },
    });

    console.log("✅ Created admin user:");
    console.log("   Email: admin@performancemgmt.com");
    console.log("   Password: Admin@123");
    console.log("   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!");

    // Create level frameworks for each role
    const levelFrameworks = [
        // WIS (Developer) levels
        {
            role: UserRole.WIS,
            levelName: "Junior Developer",
            expectationsText:
                "Works on well-defined tasks with guidance. Learning core technologies and best practices. Contributes to code reviews. Delivers features with supervision.",
        },
        {
            role: UserRole.WIS,
            levelName: "Developer",
            expectationsText:
                "Works independently on features. Writes clean, maintainable code. Participates actively in code reviews. Debugs and resolves issues. Mentors junior developers.",
        },
        {
            role: UserRole.WIS,
            levelName: "Senior Developer",
            expectationsText:
                "Designs and implements complex features. Makes architectural decisions. Leads technical initiatives. Mentors team members. Improves development processes.",
        },
        {
            role: UserRole.WIS,
            levelName: "Lead Developer",
            expectationsText:
                "Drives technical strategy. Leads multiple projects. Establishes coding standards. Conducts technical interviews. Influences product roadmap.",
        },
        // QC (Tester) levels
        {
            role: UserRole.QC,
            levelName: "Junior QC",
            expectationsText:
                "Executes test cases. Reports bugs clearly. Learns testing tools and methodologies. Performs regression testing. Documents test results.",
        },
        {
            role: UserRole.QC,
            levelName: "QC Engineer",
            expectationsText:
                "Creates comprehensive test plans. Automates test cases. Identifies edge cases. Collaborates with developers. Improves testing processes.",
        },
        {
            role: UserRole.QC,
            levelName: "Senior QC",
            expectationsText:
                "Designs testing strategy. Leads quality initiatives. Implements test automation frameworks. Mentors QC team. Ensures quality standards.",
        },
        {
            role: UserRole.QC,
            levelName: "QC Lead",
            expectationsText:
                "Defines quality standards. Manages QC team. Drives test automation adoption. Collaborates with product and engineering. Improves release processes.",
        },
        // PC (Project Coordinator) levels
        {
            role: UserRole.PC,
            levelName: "Junior Coordinator",
            expectationsText:
                "Supports project tracking. Schedules meetings. Maintains documentation. Follows up on action items. Learns project management tools.",
        },
        {
            role: UserRole.PC,
            levelName: "Project Coordinator",
            expectationsText:
                "Manages project timelines. Coordinates across teams. Tracks deliverables. Identifies risks. Facilitates communication. Updates stakeholders.",
        },
        {
            role: UserRole.PC,
            levelName: "Senior Coordinator",
            expectationsText:
                "Manages multiple projects. Optimizes processes. Resolves conflicts. Mentors coordinators. Improves project workflows. Drives efficiency.",
        },
        {
            role: UserRole.PC,
            levelName: "Project Manager",
            expectationsText:
                "Defines project strategy. Manages stakeholder expectations. Leads cross-functional teams. Drives project success. Establishes best practices.",
        },
    ];

    for (const framework of levelFrameworks) {
        await prisma.levelFramework.upsert({
            where: {
                role_levelName: {
                    role: framework.role,
                    levelName: framework.levelName,
                },
            },
            update: {},
            create: framework,
        });
    }

    console.log(`✅ Created ${levelFrameworks.length} level framework entries`);

    // Create current quarter cycle
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    const quarterStartMonth = (currentQuarter - 1) * 3;
    const quarterEndMonth = quarterStartMonth + 2;

    const cycleStart = new Date(currentYear, quarterStartMonth, 1);
    const cycleEnd = new Date(currentYear, quarterEndMonth + 1, 0); // Last day of quarter

    const cycle = await prisma.cycle.upsert({
        where: {
            id: "current-quarter",
        },
        update: {},
        create: {
            id: "current-quarter",
            type: CycleType.QUARTER,
            label: `Q${currentQuarter} ${currentYear}`,
            startAt: cycleStart,
            endAt: cycleEnd,
        },
    });

    console.log(`✅ Created cycle: ${cycle.label}`);

    // Create sample team
    const engineeringTeam = await prisma.team.upsert({
        where: { id: "engineering-team" },
        update: {},
        create: {
            id: "engineering-team",
            name: "Engineering",
            description: "Core engineering team",
        },
    });

    console.log(`✅ Created team: ${engineeringTeam.name}`);

    console.log("\n🎉 Database seed completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Update .env with your database connection");
    console.log("2. Run: npm run prisma:migrate:dev");
    console.log("3. Login with admin credentials above");
    console.log("4. Create users and start managing performance!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
