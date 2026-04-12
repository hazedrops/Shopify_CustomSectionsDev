document.addEventListener("DOMContentLoaded", () => {
  const productRoots = document.querySelectorAll("[data-product-root]")

  productRoots.forEach((root) => {
    const stickyBar = root.querySelector("[data-sticky-atc]")
    const stickyButton = root.querySelector("[data-sticky-atc-submit]")
    const stickyVariant = root.querySelector("[data-sticky-atc-variant]")
    const stickyPrice = root.querySelector("[data-sticky-atc-price]")
    const stickyComparePrice = root.querySelector("[data-sticky-atc-compare-price]")
    const stickyStatus = root.querySelector("[data-sticky-atc-status]")
    const stickyImage = root.querySelector("[data-sticky-atc-image]")
    const mainProductArea = root.querySelector("[data-main-product-area]")
    const form = root.querySelector('form[action*="/cart/add"]')
    const backButton = root.querySelector("[data-sticky-atc-back]")    

    
    if(!stickyBar || !stickyButton || !mainProductArea || !form ) return
    
    const mainPrice = root.querySelector("[data-product-price]")
    const mainComparePrice = root.querySelector("[data-product-compare-price]")
    const mainStatus = root.querySelector("[data-product-status]")
    const mainImage = root.querySelector("[data-product-image]")    
    const variantInput = form.querySelector('input[name="id"]')
    const submitButton = form.querySelector(
      '[data-add-to-cart], input[type="submit"], button[type="submit"]'
    )

    function showStickyBar() {
      if(!stickyBar.hidden && stickyBar.classList.contains("product-sticky-atc--visible")) {
        return
      }

      stickyBar.hidden = false

      requestAnimationFrame(() => {
        stickyBar.classList.add("product-sticky-atc--visible")
      })
    }

    function hideStickyBar() {
      if(stickyBar.hidden || !stickyBar.classList.contains("product-sticky-atc--visible")) {
        return
      }

      stickyBar.classList.remove("product-sticky-atc--visible")

      function handleTransitionEnd(e) {
        if(e.target !== stickyBar) return
        if(e.propertyName !== "transform") return

        if(!stickyBar.classList.contains("product-sticky-atc--visible")) {
          stickyBar.hidden = true
        }

        stickyBar.removeEventListener("transitionend", handleTransitionEnd)
      }      

      stickyBar.addEventListener("transitionend", handleTransitionEnd)
    }

    let stickyTriggerPoint = 0

    function calculateStickyTriggerPoint() {
      const rect = mainProductArea.getBoundingClientRect()
      const elementTop = window.scrollY + rect.top
      const revealOffset = window.innerWidth <= 749 ? 140 : 100
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight

      stickyTriggerPoint = Math.min(
        Math.max(elementTop - revealOffset, 0),
        Math.max(maxScrollY, 0)
      )
    }

    function updateStickyVisibility() {
      const hasPassedTrigger = window.scrollY >= stickyTriggerPoint + 2

      if(hasPassedTrigger) {
        showStickyBar()
      } else {
        hideStickyBar()
      }
    }

    let ticking = false

    function requestStickyVisibilityUpdate() {
      if(ticking) return

      ticking = true

      requestAnimationFrame(() => {
        updateStickyVisibility()
        ticking = false
      })
    }

    function refreshStickyMeasurements() {
      calculateStickyTriggerPoint()
      updateStickyVisibility()
    }

    window.addEventListener("scroll", requestStickyVisibilityUpdate, { passive: true})
    window.addEventListener("resize", refreshStickyMeasurements)
    window.addEventListener("load", refreshStickyMeasurements)

    refreshStickyMeasurements()

    stickyButton.addEventListener("click", () => {
      if(stickyButton.disabled) return

      if(!submitButton) return

      submitButton.click()
    })

    function syncFromMainUI() {
      if(mainPrice && stickyPrice) {
        stickyPrice.textContent = mainPrice.textContent.trim()
      }

      if(mainComparePrice && stickyComparePrice) {
        const compareText = mainComparePrice.textContent.trim()

        if(compareText) {
          stickyComparePrice.textContent = compareText
          stickyComparePrice.hidden = false
        } else {
          stickyComparePrice.textContent = ""
          stickyComparePrice.hidden = true
        }
      }

      if(mainStatus && stickyStatus) {
        stickyStatus.textContent = mainStatus.textContent.trim()
      }
     
      if(mainImage && stickyImage) {
        stickyImage.src = mainImage.src
        stickyImage.alt = mainImage.alt
      }

      const selectedOptionButtons = root.querySelectorAll(".variant-picker__option--selected")

      if(stickyVariant) {
        const selectedValues = Array.from(selectedOptionButtons).map((button) => 
          button.dataset.optionValue?.trim(),
        )

        stickyVariant.textContent = selectedValues.filter(Boolean).join(" / ") || "Selected options"
      }
     
      if(submitButton) {
        const isDisabled = submitButton.disabled

        stickyButton.disabled = isDisabled
        stickyButton.textContent = isDisabled ? "Sold out" : "Add to cart"
      }

      if(!variantInput || !variantInput.value) {
        stickyButton.disabled = true
      }
    }

    syncFromMainUI()
    refreshStickyMeasurements()

    root.addEventListener("variant:change", () => {
      syncFromMainUI()
      refreshStickyMeasurements()
    })    

    const mutationObserver = new MutationObserver(() => {
      syncFromMainUI()
      refreshStickyMeasurements()
    })

    const observedTargets = [
      root.querySelector("[data-product-price]"),
      root.querySelector("[data-product-compare-price]"),
      root.querySelector("[data-product-status]"),
      form.querySelector('[data-add-to-cart], input[type="submit"], button[type="submit"]'),
    ].filter(Boolean)

    observedTargets.forEach((target) => {
      mutationObserver.observe(target, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      })
    })

    if(backButton) {
      backButton.addEventListener("click", () => {
        mainProductArea.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      })
    }
  })
})