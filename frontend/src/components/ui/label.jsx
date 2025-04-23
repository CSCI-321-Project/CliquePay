import * as React from "react"
import PropTypes from "prop-types"

const Label = React.forwardRef(({ className, htmlFor, ...props }, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none text-gray-200 ${className}`}
      {...props}
    />
  )
})
Label.displayName = "Label"
Label.propTypes = {
  className: PropTypes.string,
  htmlFor: PropTypes.string
}

export { Label }