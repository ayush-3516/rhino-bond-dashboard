import 'dotenv/config'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())
const PORT = process.env.PORT || 3000

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')))

async function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials in .env file')
  }

  const decoded = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString())
  if (decoded.role !== 'service_role') {
    throw new Error('Invalid service role key - must use service_role')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  })
}

async function generateQRImage(qrData) {
  try {
    const fileName = `qr-${uuidv4()}.png`
    const filePath = path.join(__dirname, 'public', 'qr-codes', fileName)

    await QRCode.toFile(filePath, qrData, {
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      width: 300,
      margin: 2,
    })

    return `/qr-codes/${fileName}`
  } catch (error) {
    console.error('QR Code image generation failed:', error)
    throw new Error('Failed to generate QR code image')
  }
}

async function generateQRCodes(supabase, params) {
  const { product_id, points_value, quantity, created_by } = params

  const { data, error } = await supabase.functions.invoke('generate-qr-code', {
    body: {
      product_id,
      points_value,
      quantity,
      created_by,
    },
  })

  if (error) {
    throw new Error(`Error calling QR code generation function: ${error.message}`)
  }

  if (!data || !data.qr_codes) {
    throw new Error('Invalid response from QR code generation function')
  }

  // Generate images for each QR code
  const qrCodesWithImages = await Promise.all(
    data.qr_codes.map(async (qrCode) => {
      const imageUrl = await generateQRImage(qrCode.code)
      return {
        ...qrCode,
        image_url: imageUrl,
      }
    }),
  )

  return qrCodesWithImages
}

async function startServer() {
  try {
    const supabase = await initializeSupabase()

    app.post('/generate-qr-codes', async (req, res) => {
      try {
        const { product_id, quantity, created_by } = req.body

        if (!product_id || !quantity || !created_by) {
          return res.status(400).json({
            error: 'Missing required parameters: product_id, quantity, created_by',
          })
        }

        if (isNaN(quantity) || quantity <= 0) {
          return res.status(400).json({
            error: 'Quantity must be a positive number',
          })
        }

        const { data: product, error: productError } = await supabase
          .from('products')
          .select('points_value')
          .eq('id', product_id)
          .single()

        if (productError || !product) {
          return res.status(404).json({
            error: 'Product not found',
          })
        }

        const qrCodes = await generateQRCodes(supabase, {
          product_id,
          points_value: product.points_value,
          quantity,
          created_by,
        })

        return res.json({ qr_codes: qrCodes })
      } catch (error) {
        console.error('Error generating QR codes:', error)
        return res.status(500).json({
          error: 'Failed to generate QR codes',
          details: error.message,
        })
      }
    })

    // Create qr-codes directory if it doesn't exist
    const qrCodesDir = path.join(__dirname, 'public', 'qr-codes')
    await fs.promises.mkdir(qrCodesDir, { recursive: true })

    app.listen(PORT, () => {
      console.log(`QR Code Generator API running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to initialize server:', error)
    process.exit(1)
  }
}

startServer()
