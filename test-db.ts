import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Attempting connection...")
        await prisma.$connect()
        console.log("Connected successfully!")
        await prisma.$disconnect()
    } catch (e) {
        console.error("Connection failed:", e)
        process.exit(1)
    }
}

main()
