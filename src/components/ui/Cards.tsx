'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple'
  loading?: boolean
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  color = 'red',
  loading = false
}: StatCardProps) {
  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
  }

  const changeClasses = {
    positive: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    negative: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
  neutral: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700'
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="skeleton h-4 w-20 mb-2"></div>
            <div className="skeleton h-8 w-16 mb-2"></div>
            <div className="skeleton h-3 w-12"></div>
          </div>
          <div className="skeleton w-12 h-12 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-small font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${changeClasses[changeType]}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

interface InfoCardProps {
  title: string
  children: ReactNode
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}

export function InfoCard({ title, children, icon: Icon, actions, className = '' }: InfoCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Icon className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            )}
            <h3 className="heading-3">{title}</h3>
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple'
  disabled?: boolean
}

export function ActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  color = 'red',
  disabled = false
}: ActionCardProps) {
  const colorClasses = {
    red: 'border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/10',
    blue: 'border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10',
    green: 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/10',
    yellow: 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/10',
    purple: 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10'
  }

  const iconColorClasses = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-6 bg-white dark:bg-gray-800 border-2 rounded-xl text-left transition-all duration-200
        ${disabled 
          ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' 
          : `cursor-pointer ${colorClasses[color]}`
        }
      `}
    >
      <div className="flex items-start space-x-4">
        <div className={`w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center ${!disabled && iconColorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
          <p className="text-body">{description}</p>
        </div>
      </div>
    </button>
  )
}

interface GridLayoutProps {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function GridLayout({ children, cols = 3, gap = 'md', className = '' }: GridLayoutProps) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }

  return (
    <div className={`grid ${colsClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}