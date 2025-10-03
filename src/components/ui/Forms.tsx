'use client'

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { LucideIcon, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface FormFieldProps {
  label: string
  children: ReactNode
  error?: string
  hint?: string
  required?: boolean
  className?: string
}

export function FormField({ label, children, error, hint, required, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  error?: boolean
  label?: string
  onIconClick?: () => void
}

export function Input({ icon: Icon, error, label, onIconClick, className = '', ...props }: InputProps) {
  const inputElement = (
    <div className="relative">
      {Icon && (
        <Icon 
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${onIconClick ? 'cursor-pointer hover:text-gray-600' : ''}`}
          onClick={onIconClick}
        />
      )}
      <input
        className={`
          input-field
          ${Icon ? 'pl-10' : ''}
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
    </div>
  )

  if (label) {
    return (
      <FormField label={label} required={props.required}>
        {inputElement}
      </FormField>
    )
  }

  return inputElement
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  label?: string
  children?: React.ReactNode
}

export function Select({ error, options, placeholder, label, children, className = '', ...props }: SelectProps) {
  const selectElement = (
    <select
      className={`
        input-field
        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        ${className}
      `}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options ? options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )) : children}
    </select>
  )

  if (label) {
    return (
      <FormField label={label} required={props.required}>
        {selectElement}
      </FormField>
    )
  }

  return selectElement
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`
        input-field resize-none
        ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        ${className}
      `}
      {...props}
    />
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  loading?: boolean
  children: ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  loading, 
  children, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 text-gray-600 focus:ring-gray-500',
    danger: 'bg-red-100 hover:bg-red-200 text-red-700 focus:ring-red-500'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
      ) : Icon ? (
        <Icon className="h-4 w-4 mr-2" />
      ) : null}
      {children}
    </button>
  )
}

interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info'
  type?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function Alert({ variant, type, title, children, onClose, className = '' }: AlertProps) {
  const alertType = variant || type || 'info'
  
  const icons = {
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle,
    info: Info
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  }

  const iconStyles = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  }

  const Icon = icons[alertType]

  return (
    <div className={`border rounded-lg p-4 ${styles[alertType]} ${className}`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 mt-0.5 mr-3 ${iconStyles[alertType]}`} />
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 p-1 hover:bg-black hover:bg-opacity-10 rounded"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-red-600 ${sizeClasses[size]} ${className}`} />
  )
}

interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  children: ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ variant, children, size = 'md', className = '' }: BadgeProps) {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    neutral: 'bg-gray-100 text-gray-800'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5'
  }

  return (
    <span className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  )
}