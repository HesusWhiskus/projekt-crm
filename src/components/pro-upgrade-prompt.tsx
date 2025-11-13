import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Crown } from "lucide-react"
import Link from "next/link"

interface ProUpgradePromptProps {
  featureName: string
  description?: string
}

export function ProUpgradePrompt({ featureName, description }: ProUpgradePromptProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-purple-600" />
          Funkcja PRO
        </CardTitle>
        <CardDescription>
          {featureName} {description || "jest dostępna tylko w planie PRO"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Ulepsz plan swojej organizacji do PRO, aby uzyskać dostęp do tej funkcji.
        </p>
        <Link href="/dashboard/pro-features">
          <Button>
            Zobacz funkcje PRO
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

