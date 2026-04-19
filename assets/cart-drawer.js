document.addEventListener("DOMContentLoaded", () => {
  const drawer = document.querySelector("[data-cart-drawer]")
  const panel = document.querySelector("[data-cart-drawer-panel]")
  const overlay = document.querySelector("[data-cart-drawer-overlay]")
  const closeButton = document.querySelector("[data-cart-drawer-close]")

  if(!drawer || !panel || !overlay || !closeButton) return

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

  function bindOpenbuttons() {
    const openButtons = document.querySelectorAll("[data-cart-drawer-open]")

    openButtons.forEach((button) => {
      if(button.dataset.cartDrawerBound === "true") return

      button.addEventListener("click", (event) => {
        event.preventDefault()
        openDrawer()
      })

      button.dataset.cartDrawerBound = "true"
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

    currentContent.innerHTML = newContent.innerHTML
  }

  async function addToCart(form) {
    const formData = new FormData(form)

    const response = await fetch("/cart/add.js", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData
    })

    if(!response.ok) {
      throw new Error("Failed to add item to cart.")
    }

    return response.json()
  }

  function bindProductForms() {
    const productForms = document.querySelectorAll('form[action*="/cart/add"]')

    productForms.forEach((form) => {
      if(form.dataset.cartDrawerBound === "true") return
      
      form.addEventListener("submit", async (event) => {
        event.preventDefault()

        const submitButton = form.querySelector(
          'button[type="submit"], input[type="submit"]',
        )

        const originalButtonText = 
          submitButton && submitButton.tagName === "BUTTON" ? submitButton.textContent : submitButton?.value

        try {
          if(submitButton) {
            submitButton.disabled = true
            if(submitButton.tegName === "BUTTON") {
              submitButton.textContent = "Adding..."
            } else {
              submitButton.value = "Adding..."
            }
          }

          await addToCart(form)
          await refreshDrawerContent()
          openDrawer()
        } catch (error) {
          console.error(error)
        } finally {
          if(submitButton) {
            submitButton.disabled = false

            if(submitButton.tagName === "BUTTON") {
              submitButton.textContent = originalButtonText
            } else {
              submitButton.value = originalButtonText
            }
          }
        }
      })

      form.dataset.cartDrawerBound = "true"
    })
  }

  closeButton.addEventListener("click", closeDrawer)
  overlay.addEventListener("click", closeDrawer)

  document.addEventListener("keydown", (event) => {
    if(event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeDrawer()
    }
  })

  bindOpenbuttons()
  bindProductForms()

  window.CartDrawer = {
    open: openDrawer,
    close: closeDrawer,
    refresh: refreshDrawerContent,
  }
})