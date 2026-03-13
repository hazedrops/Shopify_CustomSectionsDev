function initProductTabs(container) {
  const sections = container.querySelectorAll(".product-tabs-section")

  sections.forEach((section) => {
    if (section.dataset.productTabsInitialized == "true") return

    const buttons = section.querySelectorAll("[data-tab-button]")
    const panels = section.querySelectorAll("[data-tab-panel]")

    if (!buttons.length || !panels.length) return

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-tab-target")

        buttons.forEach((item) => {
          item.classList.remove("is-active")
          item.setAttribute("aria-selected", "false")
        })

        panels.forEach((panel) => {
          panel.classList.remove("is-active")
          panel.hidden = true
        })

        button.classList.add("is-active")
        button.setAttribute("aria-selected", "true")

        const targetPanel = section.querySelector(`#${targetId}`)

        if (targetPanel) {
          targetPanel.classList.add("is-active")
          targetPanel.hidden = false
        }
      })
    })

    section.dataset.productTabsInitialized = "true"
  })
}

document.addEventListener("DOMContentLoaded", () => {
  initProductTabs(document)
})

document.addEventListener("shopify:section:load", (event) => {
  initProductTabs(event.target)
})
