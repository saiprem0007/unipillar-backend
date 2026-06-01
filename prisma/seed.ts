import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

// ── helpers ──────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[,*\s₹]/g, '').trim()
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

function detectType(name: string, shortName: string): string {
  const c = (name + ' ' + shortName).toUpperCase()
  if (c.includes('INDIAN INSTITUTE OF TECHNOLOGY') || shortName.toUpperCase().startsWith('IIT')) return 'IIT'
  if (
    c.includes('NATIONAL INSTITUTE OF TECHNOLOGY') ||
    ['NIT', 'MNIT', 'MANIT', 'MNNIT', 'SVNIT', 'VNIT', 'NITK'].some((p) =>
      shortName.toUpperCase().startsWith(p)
    )
  ) return 'NIT'
  if (
    c.includes('INFORMATION TECHNOLOGY') ||
    ['IIIT', 'IIITN', 'IIITM', 'IIITDM', 'IIITV'].some((p) =>
      shortName.toUpperCase().startsWith(p)
    )
  ) return 'IIIT'
  return 'OTHER'
}

// ── seed seat records ─────────────────────────────────────────────────────────

async function seedSeatRecords() {
  const results: any[] = []
  const filePath = path.join(__dirname, '../data/final_list_merged.csv')

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`SeatRecord CSV rows loaded: ${results.length}`)

  const formatted = results.map((row) => ({
    institute: row['Institute'] || row['Institute'],
    program: row['Academic Program Name'],
    quota: row['Quota'],
    seatType: row['Seat Type'],
    gender: row['Gender'],
    year: Number(row['Year']),
    openingRank: Number(row['Opening Rank']),
    closingRank: Number(row['Closing Rank']),
    round: Number(row['Round']),
    isPwd: row['isPwd'],
  }))

  console.log("Pusher activated: Writing SeatRecords to Neon Cloud via createMany...")

  // High-performance batching chunk
  const batchSize = 5000
  for (let i = 0; i < formatted.length; i += batchSize) {
    const batch = formatted.slice(i, i + batchSize)

    await prisma.seatRecord.createMany({
      data: batch,
      skipDuplicates: true, // Safe processing: automatically skips rows already in the database
    })

    console.log(`SeatRecord progress: ${Math.min(i + batchSize, formatted.length)}/${formatted.length}`)
  }

  console.log(`SeatRecord done!`)
}

// ── seed college fees ─────────────────────────────────────────────────────────

async function seedCollegeFees() {
  const results: any[] = []
  const filePath = path.join(__dirname, '../data/All_IIT_NIT_Colleges_Fees.csv')

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CollegeFee CSV rows loaded: ${results.length}`)

  const formattedFees: any[] = []

  for (const row of results) {
    const collegeName = (row['CollegeName'] || '').trim()
    const collegeShortName = (row['CollegeShortName'] || '').trim()
    const fees = parseAmount(row['Fees'] || '0')
    const instType = detectType(collegeName, collegeShortName)

    if (!collegeName || !collegeShortName || fees === 0) {
      continue
    }

    formattedFees.push({ collegeName, collegeShortName, fees, instType })
  }

  await prisma.collegeFeeV2.createMany({
    data: formattedFees,
    skipDuplicates: true,
  })

  console.log(`CollegeFee done!`)
}

// ── seed cutoff predictions ──────────────────────────────────────────────────

async function seedCutoffPredictions() {
  const results: any[] = []
  const filePath = path.join(__dirname, '../data/JOSAA_2026_Predicted_Cutoffs.csv')

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping CutoffPrediction seed: File not found ${filePath}`)
    return
  }

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`CutoffPrediction CSV rows loaded: ${results.length}`)

  const formattedPredictions = results.map((row) => {
    const institute = row['Institute'] || ''
    const branchShortcut = row['branch_shortcut'] || ''
    const quota = row['Quota'] || ''
    const seatType = row['Seat Type'] || ''
    const gender = row['Gender'] || ''

    const idId = `${institute}-${branchShortcut}-${quota}-${seatType}-${gender}`.replace(/\s+/g, '-').substring(0, 190)

    return {
      id: idId,
      institute: institute,
      collegeState: row['college_state'] || null,
      branchShortcut: branchShortcut,
      degreeType: row['degree_type'] || null,
      quota: quota,
      seatType: seatType,
      gender: gender,
      predictedClosingRank2026: Number(row['predicted_closing_rank_2026']) || 0,
      instituteType: row['institute_type'] || null,
      globalPrestigeIndex: parseFloat(row['Global_Prestige_Index']) || 0,
      globalBranchPopularity: parseFloat(row['Global_Branch_Popularity']) || 0,
    }
  })

  console.log("Pusher activated: Writing CutoffPredictions to Neon Cloud via createMany...")

  const batchSize = 5000
  for (let i = 0; i < formattedPredictions.length; i += batchSize) {
    const batch = formattedPredictions.slice(i, i + batchSize)

    await prisma.cutoffPrediction.createMany({
      data: batch,
      skipDuplicates: true,
    })

    console.log(`CutoffPrediction progress: ${Math.min(i + batchSize, formattedPredictions.length)}/${formattedPredictions.length}`)
  }

  console.log(`CutoffPrediction done!`)
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  await seedSeatRecords()
  await seedCollegeFees()
  await seedCutoffPredictions()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })