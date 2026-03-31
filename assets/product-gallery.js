document.addEventListener("DOMContentLoaded", () => {
  const productRoots = document.querySelectorAll("[data-product-root]")

  productRoots.forEach((root) => {
    const mainImage = root.querySelector("[data-product-image]")
    const thumbnails = root.querySelectorAll("[data-product-thumbnail]")

    if(!mainImage || !thumbnails.length) return

    function setActiveThumbnailByMediaId(mediaId) {
      thumbnails.forEach((thumbnail) => {
        const isActive = String(thumbnail.dataset.mediaId) === String(mediaId)

        thumbnail.classList.toggle("product-gallery__thumbnail--active", isActive)
        thumbnail.setAttribute("aria-current", isActive ? "true" : "false")
      })
    }
 
    function updateGalleryImage({src, alt, mediaId}) {
      if(!src) return

      mainImage.classList.add("product-image--updating")

      setTimeout(() => {
        mainImage.src = src
        mainImage.alt = alt || mainImage.alt

        mainImage.classList.remove("product-image--updating")
      }, 150)


      if(mediaId) {
        setActiveThumbnailByMediaId(mediaId)
      }
    }

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => {
        updateGalleryImage({
          src: thumbnail.dataset.mediaSrc,
          alt: thumbnail.dataset.mediaAlt,
          mediaId: thumbnail.dataset.mediaId,
        })
      })
    })

    root.updateGalleryImage = updateGalleryImage    
  })
})