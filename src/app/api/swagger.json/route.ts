import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger'

/**
 * @swagger
 * /api/swagger.json:
 *   get:
 *     summary: Pobiera specyfikację OpenAPI/Swagger
 *     description: Zwraca pełną specyfikację API w formacie OpenAPI 3.0
 *     tags: [Swagger]
 *     responses:
 *       200:
 *         description: Specyfikacja OpenAPI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  return NextResponse.json(swaggerSpec)
}

