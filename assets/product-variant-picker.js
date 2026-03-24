document.addEventListener("DOMContentLoaded", () => {
  const pickers = document.querySelectorAll("[data-variant-picker]")

  pickers.forEach((picker) => {
    const variants = JSON.parse(picker.dataset.variants)
    const form = picker.closest("form")
    const variantInput = form.querySelector('input[name="id"]')
    const optionButtons = picker.querySelectorAll(".variant-picker__option")
    const addToCartButton = form.querySelector(
      'input[type="submit"], button[type="submit"]',
    )

    const selectedOptions = {}

    optionButtons.forEach((button) => {
      const optionPosition = Number(button.dataset.optionPosition)

      selectedOptions[optionPosition] = button.classList.contains(
        "variant-picker__option--selected",
      )
        ? button.dataset.optionValue
        : selectedOptions[optionPosition]
    })

    function setButtonText(button, text) {
      if (button.tagName === "INPUT") {
        button.value = text
      } else {
        button.textContent = text
      }
    }

    function getMatchedVariant() {
      return variants.find((variant) => {
        return [variant.option1, variant.option2, variant.option3].every(
          (optionValue, index) => {
            const position = index + 1

            if (!selectedOptions[position]) {
              return true
            }

            return selectedOptions[position] == optionValue
          },
        )
      })
    }

    function updateOptionAvailability() {
      const groups = picker.querySelectorAll(".variant-picker__group")

      groups.forEach((group) => {
        const groupButtons = group.querySelectorAll(".variant-picker__option")

        groupButtons.forEach((button) => {
          const testSelection = { ...selectedOptions }
          const optionPosition = Number(button.dataset.optionPosition)
          testSelection[optionPosition] = button.dataset.optionValue
          const matchingVariantExists = variants.some((variant) => {
            return [variant.option1, variant.option2, variant.option3].every(
              (optionValue, index) => {
                const position = index + 1

                if (!testSelection[position]) {
                  return true
                }

                return testSelection[position] === optionValue
              },
            )
          })

          button.disabled = !matchingVariantExists
          button.classList.toggle(
            "variant-picker__option--disabled",
            !matchingVariantExists,
          )
        })
      })
    }

    function updateFormState() {
      const matchedVariant = getMatchedVariant()

      if (matchedVariant) {
        variantInput.value = matchedVariant.id

        if (addToCartButton) {
          if (matchedVariant.available) {
            addToCartButton.disabled = false

            setButtonText(addToCartButton, "Add to cart")
          } else {
            addToCartButton.disabled = true

            setButtonText(addToCartButton, "Sold out")
          }
        }
      } else {
        variantInput.value = ""

        if (addToCartButton) {
          addToCartButton.disabled = true

          setButtonText(addToCartButton, "Unavailable")
        }
      }

      updateOptionAvailability()
    }

    optionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return

        const optionPosition = Number(button.dataset.optionPosition)
        const optionValue = button.dataset.optionValue

        selectedOptions[optionPosition] = optionValue

        const groupButtons = picker.querySelectorAll(
          `.variant-picker__option[data-option-position="${optionPosition}"]`,
        )

        groupButtons.forEach((groupButton) => {
          groupButton.classList.remove("variant-picker__option--selected")
        })

        button.classList.add("variant-picker__option--selected")

        updateFormState()
      })
    })
    updateFormState()
  })
})
