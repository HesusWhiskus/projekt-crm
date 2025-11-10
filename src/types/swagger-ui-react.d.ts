declare module 'swagger-ui-react' {
  import { ComponentType } from 'react'

  export interface SwaggerUIProps {
    spec?: Record<string, any> | string
    url?: string
    docExpansion?: 'list' | 'full' | 'none'
    defaultModelsExpandDepth?: number
    defaultModelExpandDepth?: number
    persistAuthorization?: boolean
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>
  export default SwaggerUI
}

declare module 'swagger-ui-react/swagger-ui.css' {
  const content: string
  export default content
}

