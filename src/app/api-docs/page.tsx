import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import dynamic from 'next/dynamic'

// Dynamic import Swagger UI (tylko po stronie klienta)
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="p-8">Ładowanie dokumentacji API...</div>,
})

// Import CSS dla Swagger UI
import 'swagger-ui-react/swagger-ui.css'

export default async function ApiDocsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/signin?callbackUrl=/api-docs')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Dokumentacja API</h1>
          <p className="text-muted-foreground">
            Interaktywna dokumentacja API Internal CRM. Wszystkie endpointy wymagają autoryzacji.
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <SwaggerUI 
            url="/api/swagger.json"
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            persistAuthorization={true}
          />
        </div>
      </div>
    </div>
  )
}

