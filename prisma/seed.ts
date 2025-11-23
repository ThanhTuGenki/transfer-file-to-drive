import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
	const saltRounds = 10;
	return bcrypt.hash(password, saltRounds);
}

async function main() {
	console.log('Start seeding...');

	await prisma.user.deleteMany({ where: { role: UserRole.ADMIN } });
	const adminPassword = await hashPassword('tyziiu789');

	const admin = await prisma.user.create({
		data: {
			email: 'admin@shareup.com',
			name: 'Admin ShareUp',
			role: UserRole.ADMIN,
			password: adminPassword,
		},
	});

	console.log(`Created admin user: ${admin.email}`);

	console.log('Seeding finished.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
