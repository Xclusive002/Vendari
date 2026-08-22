import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardProps {
  icon: ReactNode
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

export function StatsCard({
  icon,
  label,
  value,
  change,
  changeType = 'neutral',
}: StatsCardProps) {
  const changeColor = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-slate-400',
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur hover:bg-slate-800/70 transition">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400 mb-2">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {change && (
              <p className={`text-xs mt-2 ${changeColor[changeType]}`}>{change}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
