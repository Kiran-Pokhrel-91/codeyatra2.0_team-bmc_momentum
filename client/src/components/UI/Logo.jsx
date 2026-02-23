import React from 'react'
import { Link } from 'react-router-dom'

const Logo = ({ 
  size = 'md', 
  variant = 'light', 
  linkTo = '/', 
  onClick,
  showText = true,
  className = '' 
}) => {
  const sizes = {
    sm: { img: 'w-8 h-8', text: 'text-base' },
    md: { img: 'w-10 h-10', text: 'text-xl' },
    lg: { img: 'w-12 h-12', text: 'text-2xl' },
  }

  const textColors = {
    light: 'from-indigo-600 to-purple-600',
    dark: 'from-indigo-400 to-purple-400',
  }

  const { img, text } = sizes[size] || sizes.md

  const content = (
    <>
      <img
        src="/new logo.jpeg"
        alt="MOMENTUM Logo"
        className={`${img} rounded-xl object-cover shadow-md shadow-indigo-200/50 group-hover:shadow-lg group-hover:shadow-indigo-300/50 transition-all duration-300 group-hover:scale-105`}
        loading="eager"
      />
      {showText && (
        <span className={`${text} font-extrabold bg-linear-to-r ${textColors[variant]} bg-clip-text text-transparent tracking-tight`}>
          MOMENTUM
        </span>
      )}
    </>
  )

  const wrapperClass = `flex items-center gap-2.5 group cursor-pointer ${className}`

  if (onClick) {
    return (
      <div onClick={onClick} className={wrapperClass} role="button" aria-label="MOMENTUM - Go to home">
        {content}
      </div>
    )
  }

  return (
    <Link to={linkTo} className={wrapperClass} aria-label="MOMENTUM - Go to home">
      {content}
    </Link>
  )
}

export default React.memo(Logo)
