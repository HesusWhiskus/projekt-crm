#!/usr/bin/env tsx
/**
 * Skrypt weryfikacji dokumentacji Swagger/OpenAPI
 * Porównuje wygenerowaną specyfikację z dokumentacją w API_DOCUMENTATION.md
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { swaggerSpec } from '../src/lib/swagger'

interface EndpointInfo {
  path: string
  method: string
  summary?: string
  description?: string
  parameters?: any[]
  requestBody?: any
  responses?: any
}

interface VerificationResult {
  endpoint: string
  method: string
  status: 'ok' | 'missing' | 'mismatch'
  issues: string[]
}

function extractEndpointsFromSwagger(spec: any): Map<string, EndpointInfo> {
  const endpoints = new Map<string, EndpointInfo>()
  
  if (!spec.paths) {
    return endpoints
  }
  
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, definition] of Object.entries(methods as any)) {
      if (['get', 'post', 'patch', 'put', 'delete'].includes(method.toLowerCase())) {
        const key = `${method.toUpperCase()} ${path}`
        endpoints.set(key, {
          path,
          method: method.toUpperCase(),
          summary: definition.summary,
          description: definition.description,
          parameters: definition.parameters,
          requestBody: definition.requestBody,
          responses: definition.responses,
        })
      }
    }
  }
  
  return endpoints
}

function extractEndpointsFromMarkdown(markdown: string): Map<string, any> {
  const endpoints = new Map<string, any>()
  
  // Extract endpoint patterns like "### GET /api/clients" or "### POST /api/clients"
  const endpointRegex = /###\s+(GET|POST|PATCH|PUT|DELETE)\s+(\/api\/[^\s]+)/g
  let match
  
  while ((match = endpointRegex.exec(markdown)) !== null) {
    const method = match[1]
    const path = match[2]
    const key = `${method} ${path}`
    
    // Extract description (next paragraph after endpoint)
    const startIndex = match.index + match[0].length
    const nextSection = markdown.indexOf('###', startIndex)
    const sectionContent = nextSection !== -1 
      ? markdown.substring(startIndex, nextSection)
      : markdown.substring(startIndex)
    
    endpoints.set(key, {
      method,
      path,
      content: sectionContent.trim(),
    })
  }
  
  return endpoints
}

function verifyEndpoints(
  swaggerEndpoints: Map<string, EndpointInfo>,
  markdownEndpoints: Map<string, any>
): VerificationResult[] {
  const results: VerificationResult[] = []
  
  // Check all Swagger endpoints exist in markdown
  for (const [key, swaggerEndpoint] of swaggerEndpoints) {
    const issues: string[] = []
    
    if (!markdownEndpoints.has(key)) {
      issues.push(`Endpoint nie został znaleziony w API_DOCUMENTATION.md`)
      results.push({
        endpoint: swaggerEndpoint.path,
        method: swaggerEndpoint.method,
        status: 'missing',
        issues,
      })
      continue
    }
    
    // Basic validation - check if summary/description exist
    if (!swaggerEndpoint.summary && !swaggerEndpoint.description) {
      issues.push('Brak opisu endpointu w Swagger')
    }
    
    // Check if responses are documented
    if (!swaggerEndpoint.responses || Object.keys(swaggerEndpoint.responses).length === 0) {
      issues.push('Brak dokumentacji odpowiedzi')
    }
    
    results.push({
      endpoint: swaggerEndpoint.path,
      method: swaggerEndpoint.method,
      status: issues.length > 0 ? 'mismatch' : 'ok',
      issues,
    })
  }
  
  // Check for endpoints in markdown that are not in Swagger
  for (const [key, markdownEndpoint] of markdownEndpoints) {
    if (!swaggerEndpoints.has(key)) {
      results.push({
        endpoint: markdownEndpoint.path,
        method: markdownEndpoint.method,
        status: 'missing',
        issues: ['Endpoint istnieje w API_DOCUMENTATION.md ale nie został udokumentowany w Swagger'],
      })
    }
  }
  
  return results
}

function main() {
  console.log('🔍 Weryfikacja dokumentacji Swagger...\n')
  
  try {
    // Load API_DOCUMENTATION.md
    const apiDocPath = join(process.cwd(), 'API_DOCUMENTATION.md')
    const apiDocContent = readFileSync(apiDocPath, 'utf-8')
    
    // Extract endpoints from both sources
    const swaggerEndpoints = extractEndpointsFromSwagger(swaggerSpec)
    const markdownEndpoints = extractEndpointsFromMarkdown(apiDocContent)
    
    console.log(`📊 Znaleziono ${swaggerEndpoints.size} endpointów w Swagger`)
    console.log(`📊 Znaleziono ${markdownEndpoints.size} endpointów w API_DOCUMENTATION.md\n`)
    
    // Verify
    const results = verifyEndpoints(swaggerEndpoints, markdownEndpoints)
    
    // Report results
    const ok = results.filter(r => r.status === 'ok').length
    const missing = results.filter(r => r.status === 'missing').length
    const mismatch = results.filter(r => r.status === 'mismatch').length
    
    console.log('📋 Wyniki weryfikacji:\n')
    console.log(`✅ Poprawne: ${ok}`)
    console.log(`⚠️  Brakujące: ${missing}`)
    console.log(`🔧 Wymagają poprawy: ${mismatch}\n`)
    
    if (missing > 0 || mismatch > 0) {
      console.log('📝 Szczegóły:\n')
      
      for (const result of results) {
        if (result.status !== 'ok') {
          console.log(`${result.status === 'missing' ? '❌' : '⚠️ '} ${result.method} ${result.endpoint}`)
          for (const issue of result.issues) {
            console.log(`   - ${issue}`)
          }
          console.log()
        }
      }
      
      process.exit(1)
    } else {
      console.log('✅ Wszystkie endpointy są poprawnie udokumentowane!\n')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Błąd podczas weryfikacji:', error)
    process.exit(1)
  }
}

main()

