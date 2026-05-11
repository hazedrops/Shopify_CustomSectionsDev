document.addEventListener("DOMContentLoaded", () => {
  const drawer = document.querySelector("[data-cart-drawer]")
  const panel = document.querySelector("[data-cart-drawer-panel]")
  const overlay = document.querySelector("[data-cart-drawer-overlay]")
  const closeButton = document.querySelector("[data-cart-drawer-close]")

  if(!drawer || !panel || !overlay || !closeButton) return

  let maxedVariantId = null

  function setButtonText(button, text) {
    if(!button) return

    if(button.tagName === "BUTTON") {
      button.textContent = text
    } else {
      button.value = text
    }
  }

  function disableSubmitButton(button,text = "Max in cart") {
    if(!button) return

    button.disabled = true
    setButtonText(button, text)    
  }

  function enableSubmitButton(button, text) {
    if(!button) return

    button.disabled = false
    setButtonText(button, text)
  }

  function syncSubmitButtonState(form) {
    if(!form) return

    const submitButton = form.querySelector(
      'button[type="submit"], input[type="submit"]'
    )

    const variantInput = form.querySelector('[name="id"]')

    if(!submitButton || !variantInput) return

    if(submitButton.dataset.variantUnavailable === "true") return

    if(!submitButton.dataset.originalText) {
      submitButton.dataset.originalText = submitButton.tagName === "BUTTON" ? submitButton.textContent.trim() : submitButton.value
    }

    const originalButtonText = submitButton.dataset.originalText || "Add to cart"

    if(String(variantInput.value) === String(maxedVariantId)) {
      disableSubmitButton(submitButton, "Max in cart")
    } else {
      enableSubmitButton(submitButton, originalButtonText)
    }
  }

  function openDrawer() {
    drawer.classList.add("is-open")
    document.body.classList.add("cart-drawer-open")
    panel.setAttribute("aria-hidden", "false")    
    panel.focus()
  }

  function closeDrawer() {
    drawer.classList.remove("is-open")
    document.body.classList.remove("cart-drawer-open")
    panel.setAttribute("aria-hidden", "true")
  }

  function bindOpenButtons() {
    const openButtons = document.querySelectorAll("[data-cart-drawer-open]")

    openButtons.forEach((button) => {
      if(button.dataset.cartDrawerOpenBound === "true") return

      button.addEventListener("click", (event) => {
        event.preventDefault()
        openDrawer()
      })

      button.dataset.cartDrawerOpenBound = "true"
    })
  }

  async function refreshDrawerContent() {
    const response = await fetch(window.location.pathname, {
      method: "GET",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    if(!response.ok) {
      throw new Error("Failed to fetch updated cart drawer markup.")
    }

    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const newContent = doc.querySelector("[data-cart-drawer-content]")
    const currentContent = drawer.querySelector("[data-cart-drawer-content]")

    if(!newContent || !currentContent) {
      throw new Error("Cart drawer content not found in fetched markup.")
    }

    currentContent.innerHTML = newContent.innerHTML // destroys the old DOM, so need to re-connect to the event listeners & references

    bindDrawerActions()
    updateCartCount()

    document.querySelectorAll('form[action*="/cart/add"]').forEach((form) => syncSubmitButtonState(form))
  }

  function getAddToCartErrorType(message = "") {
    const msg = message.toLowerCase()

    if (msg.includes("maximum quantity") ||
        msg.includes("already in your cart")
    ) return "MAX_QUANTITY"

    if (msg.includes("only") &&
        msg.includes("added to your cart")
    ) return "PARTIAL_ADD"

    if (msg.includes("sold out") ||
        msg.includes("unavailable")
    ) return "UNAVAILABLE"

    return "UNKNOWN"
  }

  async function addToCart(form) {
    const formData = new FormData(form)

    const response = await fetch("/cart/add.js", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData,
    })

    const data = await response.json().catch(() => null)

    if(!response.ok) {
      const errorMessage = data?.description || data?.message || "Unable to add item to cart."

      return {
        error: true,
        type: getAddToCartErrorType(errorMessage),
        message: errorMessage,
      }   
    }  

    return {
      error: false,
      data,
    }
  }

  async function changeCartLine(line, quantity) {
    const response = await fetch("/cart/change.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        line,
        quantity,
      }),
    })

    const data = await response.json().catch(() => null)

    if(!response.ok) {
      const errorMessage = data?.description || data?.message || "Failed to update cart line."

      return {
        error: true,
        type: getAddToCartErrorType(errorMessage),
        message: errorMessage,
      }
    }

    return {
      error: false,
      data,
    }
  }

  function showDrawerNotice(message) {
    const drawerContent = drawer.querySelector("[data-cart-drawer-content]")    
    if(!drawerContent) return

    const existingNotice = drawer.querySelector("[data-cart-drawer-notice]")
    if(existingNotice) existingNotice.remove()

    const notice = document.createElement('div')  
    notice.className = "cart-drawer__notice"
    notice.setAttribute("data-cart-drawer-notice", "")
    notice.setAttribute("role", "status")
    notice.textContent = message || "You already have the maximum quantity for this item in your cart."

    const header = drawer.querySelector(".cart-drawer__header")

    if(header) {
      header.insertAdjacentElement("afterend", notice)
    } else {
      drawerContent.prepend(notice)      
    }
  }

  async function updateCartCount() {
    const response = await fetch("/cart.js", {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    if(!response.ok) return

    const cart = await response.json()
    const countElements = document.querySelectorAll("[data-cart-count]")
    const countWrapperElements = document.querySelectorAll("[data-cart-count-wrapper]")

    countElements.forEach((element) => {
      element.textContent = cart.item_count
    })

    countWrapperElements.forEach((element) => {      
        element.hidden = cart.item_count === 0
    })
  }

  function bindProductForms() {
    const productForms = document.querySelectorAll('form[action*="/cart/add"]')

    productForms.forEach((form) => {
      if(form.dataset.cartDrawerFormBound === "true") return
      
      const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]',
      )

      if(submitButton && !submitButton.dataset.originalText) {
        submitButton.dataset.originalText = submitButton.tagName === "BUTTON" ? submitButton.textContent.trim() : submitButton.value
      }

      form.addEventListener("submit", async (event) => {
        event.preventDefault()

        const variantInput = form.querySelector('[name="id"]');
        const originalButtonText = submitButton?.dataset.originalText || "Add to cart"
        
        try {
          if(submitButton) {
            submitButton.disabled = true
            setButtonText(submitButton, "Adding...")
          }

          const result = await addToCart(form)          

          if(result.error) {
            if(result.type === "MAX_QUANTITY") {
              maxedVariantId = variantInput?.value || null    

              await refreshDrawerContent()
              openDrawer()
              showDrawerNotice(result.message)
              syncSubmitButtonState(form)
              return
            }

            if(result.type === 'PARTIAL_ADD') {
              await refreshDrawerContent()
              openDrawer()
              showDrawerNotice(result. message)
              return
            }

            enableSubmitButton(submitButton, originalButtonText)

            await refreshDrawerContent()
            openDrawer()
            showDrawerNotice(result.message)

            return
          }
          maxedVariantId = null

          await refreshDrawerContent()
          openDrawer()
        } catch (error) {
          console.error(error)
          enableSubmitButton(submitButton, originalButtonText)
        } finally {
          if(submitButton && String(variantInput?.value) !== String(maxedVariantId)) {
            enableSubmitButton(submitButton, originalButtonText)
          }
        }
      })

      const productRoot = form.closest("[data-product-root]")

      if(productRoot && form.dataset.cartDrawerVariantBound !== "true") {
        productRoot.addEventListener("variant:change", () => {
          syncSubmitButtonState(form)
        })
        
        form.dataset.cartDrawerVariantBound = "true"
      }

      form.dataset.cartDrawerFormBound = "true"
      syncSubmitButtonState(form)
    })
  }

  function bindDrawerActions() {
    const quantityInputs = drawer.querySelectorAll("[data-cart-quantity-input]")
    const removeButtons = drawer.querySelectorAll("[data-cart-remove]")

    quantityInputs.forEach((input) => {
      if(input.dataset.cartDrawerQuantityBound === "true") return

      input.addEventListener("change", async () => {
        if(input.dataset.cartUpdating === "true") return

        input.dataset.cartUpdating = "true"
        input.disabled = true

        const line = Number(input.dataset.lineIndex)
        const quantity = Number(input.value)

        if(!line || quantity < 0) {
          input.dataset.cartUpdating = "false"
          input.disabled = false

          return
        }

        try {
          const result = await changeCartLine(line, quantity)

          if(result.error) {
            await refreshDrawerContent()
            openDrawer()
            showDrawerNotice(result.message)
            return
          }
          
          maxedVariantId = null
          await refreshDrawerContent()
          openDrawer()
        } catch(error) {
          console.error(error)

          await refreshDrawerContent()
          openDrawer()
          showDrawerNotice("Unable to update cart quantity. Please try again.")
        } finally {
          input.dataset.cartUpdating = "false"
          input.disabled = false
        }
      })

      input.dataset.cartDrawerQuantityBound = "true"
    })

    removeButtons.forEach((button) => {
      if(button.dataset.cartDrawerRemoveBound === "true") return

      button.addEventListener("click", async () => {
        const line = Number(button.dataset.lineIndex)

        if(!line) return

        button.disabled = true

        try {
          const result = await changeCartLine(line, 0)
          
          if(result.error) {
            await refreshDrawerContent()
            openDrawer()
            showDrawerNotice(result.message)
            return
          }

          maxedVariantId = null
          await refreshDrawerContent()
          openDrawer()
        } catch(error) {
          console.error(error)
          showDrawerNotice("Unable to remove item. Please try again.")
        } finally {
          button.disabled = false
        }
      })

      button.dataset.cartDrawerRemoveBound = "true"
    })
  }

  closeButton.addEventListener("click", closeDrawer)
  overlay.addEventListener("click", closeDrawer)

  document.addEventListener("keydown", (event) => {
    if(event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer()
    }
  })

  bindOpenButtons()
  bindProductForms()
  bindDrawerActions()

  window.CartDrawer = {
    open: openDrawer,
    close: closeDrawer,
    refresh: refreshDrawerContent,
  }
})