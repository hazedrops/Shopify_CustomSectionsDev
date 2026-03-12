function activateProductTab(section, targetId) {
  const buttons = section.querySelectorAll("[data-tab-button]")
  const panels = section.querySelectorAll("[data-tab-panel]")

  if (!buttons.length || !panels.length) return

  buttons.forEach((button) => {
    const isMatch = button.getAttribute("data-tab-target") === targetId

    button.classList.toggle("is-active", isMatch)
    button.setAttribute("aria-selected", isMatch ? "true" : "false")
  })

  panels.forEach((panel) => {
    const isMatch = panel.id === targetId

    panel.classList.toggle("is-active", isMatch)
    panel.hidden = !isMatch
  })
}

function initProductTabs(container) {
  const sections = container.querySelectorAll(".product-tabs-section")

  sections.forEach((section) => {
    if (section.dataset.productTabsInitialized == "true") return

    const buttons = section.querySelectorAll("[data-tab-button]")

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-tab-target")
        activateProductTab(section, targetId)
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

document.addEventListener("shopify:block:select", (event) => {
  const blockElement = event.target
  const section = blockElement.closest(".product-tabs-section")

  if (!section) return

  const blockId = blockElement.dataset.blockId
  if (!blockId) return

  const matchingButton = section.querySelector(
    `[data-tab-button][data-block-id="${blockId}"]`,
  )

  if (!matchingButton) return

  const targetId = matchingButton.getAttribute("data-tab-target")
  activateProductTab(section.targetId)
})
