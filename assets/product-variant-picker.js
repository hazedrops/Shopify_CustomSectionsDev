document.addEventListener("DOMContentLoaded", () => {
  const pickers = document.querySelectorAll("[data-variant-picker]")

  pickers.forEach((picker) => {
    const variants = JSON.parse(picker.dataset.variants)
    const productRoot = picker.closest("[data-product-root]")
    const form = picker.closest("form")

    if(!productRoot || !form) return

    const variantInput = form.querySelector('input[name="id"]')
    const optionButtons = picker.querySelectorAll(".variant-picker__option")
    const priceEl = productRoot.querySelector("[data-product-price]")
    const comparePriceEl = productRoot.querySelector("[data-product-compare-price]")
    const statusEl = productRoot.querySelector("[data-product-status]")
    const addToCartButton = productRoot.querySelector("[data-add-to-cart]")

    const selectedOptions = {}

    initializeSelectedOptions()
    loadVariantFromURL()
    updateSelectedButtonStates()
    updateOptionAvailability()

    const initialVariant = getMatchedVariant()

    updateProductInfo(initialVariant)

    optionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if(button.disabled) return

        const optionPosition = Number(button.dataset.optionPosition)
        const optionValue = button.dataset.optionValue

        selectedOptions[optionPosition] = optionValue

        updateSelectedButtonStates()
        updateOptionAvailability()

        const matchedVariant = getMatchedVariant()
        updateProductInfo(matchedVariant)
      })
    })
    
    function initializeSelectedOptions() {
      optionButtons.forEach((button) => {
        if (button.classList.contains("variant-picker__option--selected")) {
          const optionPosition = Number(button.dataset.optionPosition)
          selectedOptions[optionPosition] = button.dataset.optionValue
        }
      })  
    }

    function loadVariantFromURL() {
      const params = new URLSearchParams(window.location.search)
      const variantId = params.get("variant")

      if(!variantId) return

      const variantFromURL = variants.find((variant) => {
        return String(variant.id) === String(variantId)
      })

      if(!variantFromURL) return

      selectedOptions[1] = variantFromURL.option1

      if(variantFromURL.option2) {
        selectedOptions[2] = variantFromURL.option2
      }

      if(variantFromURL.option3) {
        selectedOptions[3] = variantFromURL.option3
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

            return selectedOptions[position] === optionValue
          },
        )
      })
    }

    function updateSelectedButtonStates() {
      optionButtons.forEach((button) => {
        const optionPosition = Number(button.dataset.optionPosition)
        const optionValue = button.dataset.optionValue
        const isSelected = selectedOptions[optionPosition] === optionValue

        button.classList.toggle("variant-picker__option--selected", isSelected)
        button.setAttribute("aria-pressed", isSelected ? "true" : "false")
      })
    }

    function updateOptionAvailability() {
      optionButtons.forEach((button) => {
        const testSelection = { ...selectedOptions }
        const optionPosition = Number(button.dataset.optionPosition)
        const optionValue = button.dataset.optionValue

        testSelection[optionPosition] = optionValue

        const matchingVariantExists = variants.some((variant) => {
          return [variant.option1, variant.option2, variant.option3].every(
            (variantOptionValue, index) => {
              const position = index + 1

              if (!testSelection[position]) {
                return true
              }

              return testSelection[position] === variantOptionValue
            },
          )
        })

        button.disabled = !matchingVariantExists
        button.classList.toggle(
          "variant-picker__option--disabled",
          !matchingVariantExists,
        )
      })
    }

    function updateProductInfo(variant) {
      updateVariantInput(variant)
      updatePrice(variant)
      updateComparePrice(variant)
      updateAvailability(variant)
      updateImage(variant)
      updateURL(variant)

      productRoot.dispatchEvent(
        new CustomEvent("variant:change", {
          bubbles: true,
          detail: {
            variant,
          },
        }),
      )
    }

    function updateVariantInput(variant) {
      if(!variantInput || !variant) return

      variantInput.value = variant.id
    }

    function updatePrice(variant) {
      if(!priceEl) return

      if(!variant) {
        priceEl.textContent = ""
        return
      }

      priceEl.textContent = formatMoney(variant.price)
    }

    function updateComparePrice(variant) {
      if(!comparePriceEl) return

      if(!variant || !(variant.compare_at_price > variant.price)) {
        comparePriceEl.textContent = ""
        comparePriceEl.classList.add("hidden")
        return
      }

      comparePriceEl.textContent = formatMoney(variant.compare_at_price)
      comparePriceEl.classList.remove("hidden")
    }

    function updateAvailability(variant) {
      if(!addToCartButton || !statusEl) return

      function setAddToCartText(text) {
        if(addToCartButton.tagName === "INPUT") {
          addToCartButton.value = text
        } else {
          addToCartButton.textContent = text
        }
      }

      if(!variant) {
        addToCartButton.disabled = true
        setAddToCartText("Unavailable")
        statusEl.textContent = "Unavailable"

        return
      }

      if(variant.available) {
        addToCartButton.disabled = false
        setAddToCartText("Add to cart")
        statusEl.textContent = "In stock"
      } else {
        addToCartButton.disabled = true
        setAddToCartText("Sold out")
        statusEl.textContent = "Sold out"
      }
    }

    function updateImage(variant) {
      if(!variant || !productRoot?.updateGalleryImage) return

      const imageData = getVariantImageData(variant)

      if(!imageData) return

      productRoot.updateGalleryImage(imageData)
    }

    function updateURL(variant) {
      if(!variant) return

      const url = new URL(window.location.href)
      url.searchParams.set("variant", variant.id)
      window.history.replaceState({}, "", url)
    }

    function formatMoney(cents) {
      return new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD",
      }).format(cents / 100)
    }   

    function getVariantImageData(variant) {
      if(!variant) return

      if(variant.featured_media?.preview_image?.src) {
        return {
          src: variant.featured_media.preview_image.src,
          alt: variant.featured_media.alt || "",
          mediaId: variant.featured_media.id,
        }
      }

      if(variant.featured_media?.src) {
        return{
          src: variant.featured_media.src,
          alt: variant.featured_media.alt || "",
          mediaId: variant.featured_media.id,
        }
      }

      if(variant.featured_image?.src) {
        return {
          src: variant.featured_image.src,
          alt: variant.featured_image.alt || "",
          mediaId: variant.featured_image.id || "",
        }
      }

      return null         
    }
  })
})
