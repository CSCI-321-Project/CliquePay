import * as React from "react"
import PropTypes from 'prop-types'

const Switch = React.forwardRef(({ className, defaultChecked, checked, onChange, id, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(defaultChecked || checked || false)
  
  React.useEffect(() => {
    if (checked !== undefined) {
      setIsChecked(checked)
    }
  }, [checked])

  const handleToggle = (e) => {
    if (checked === undefined) {
      setIsChecked(!isChecked)
    }
    if (onChange) {
      onChange(e)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      ref={ref}
      id={id}
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-800 ${isChecked ? 'bg-purple-600' : 'bg-zinc-700'} ${className}`}
      {...props}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
})

Switch.displayName = "Switch"

Switch.propTypes = {
  className: PropTypes.string,
  defaultChecked: PropTypes.bool,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  id: PropTypes.string,
}

export { Switch }