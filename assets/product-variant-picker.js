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
    const imageEl = productRoot.querySelector("[data-product-image]")
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

      if(!variant) {
        addToCartButton.disabled = true
        addToCartButton.value = "Unavailable"
        statusEl.textContent = "Unavailable"

        return
      }

      if(variant.available) {
        addToCartButton.disabled = false
        addToCartButton.value = "Add to cart"
        statusEl.textContent = "In stock"
      } else {
        addToCartButton.disabled = true
        addToCartButton.value = "Sold out"
        statusEl.textContent = "Sold out"
      }
    }

    function updateImage(variant) {
      if(!imageEl || !variant) return

      const imageData = variant.featured_image || variant.featured_media

      if(!imageData) return

      const newImageSrc = imageData.src
      const newImageAlt = imageData.alt || ""

      if(!newImageSrc) return
      if(imageEl.getAttribute("src") === newImageSrc) return

      imageEl.classList.add("product-image--updating")

      setTimeout(() => {
        imageEl.setAttribute("src", newImageSrc)
        imageEl.setAttribute("alt", newImageAlt)
        imageEl.classList.remove("product-image--updating")
      }, 150)
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
  })
})
