import { NextResponse } from "next/server"
import { getSession } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { v4 as uuidv4 } from "uuid"
import * as xlsx from "xlsx"

export async function POST(request) {
    // session auth disabled for direct testing as per user request
    // const user = await getSession()
    // if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    try {
        const formData = await request.formData()
        const file = formData.get("file")

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const workbook = xlsx.read(buffer, { type: "buffer" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = xlsx.utils.sheet_to_json(sheet)

        if (data.length === 0) {
            return NextResponse.json({ error: "Excel sheet is empty" }, { status: 400 })
        }

        const participantsData = data.map((row, index) => {
            const findValue = (keywords) => {
                const keys = Object.keys(row);
                const match = keys.find(k =>
                    keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase()))
                );
                return match ? row[match] : "";
            };

            const name = findValue(["name", "full name", "student", "participant"]);
            const email = findValue(["email", "mail", "id", "address"]);
            const eventName = findValue(["event", "project", "subject", "topic", "workshop"]);

            if (!name || !email || !eventName) {
                if (index === 0) console.log("Next.js Bulk Mapping failed for first row. Keys found:", Object.keys(row));
                return null
            }

            const certificateId = uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase()

            return {
                name,
                email,
                eventName,
                certificateId,
                status: "PENDING",
            }
        }).filter(p => p !== null)

        if (participantsData.length === 0) {
            return NextResponse.json({
                error: "No valid records found. Ensure columns are Name, Email, and Event."
            }, { status: 400 })
        }

        await prisma.participant.createMany({
            data: participantsData,
            skipDuplicates: true,
        })

        return NextResponse.json({
            success: true,
            message: `${participantsData.length} students added. Starting certificate generation...`,
            count: participantsData.length,
            triggerSend: true
        })

    } catch (err) {
        console.error("Bulk upload error:", err)
        return NextResponse.json({ error: "Failed to process Excel file: " + err.message }, { status: 500 })
    }
}
