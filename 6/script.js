// navbar animation
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.create({
    trigger: "body",
    start: "top -60",
    end: "10000",

    toggleClass: {
        targets: ".navbar, .header-navbar",
        className: "active"
    },
    // markers: true
});


// related to placeholder
let changingPlaceHolder = document.getElementById("changingPlaceHolder");
let placeHolder = [
    "iced tea",
    "herbal tea",
    "green tea",
    "black tea",
    "chai tea",
]

let index = 0;
setInterval(() => {
    index = (index + 1) % placeHolder.length;
    changingPlaceHolder.textContent =
        placeHolder[index];
    changingPlaceHolder.style.animation = "none";
    changingPlaceHolder.offsetHeight;
    changingPlaceHolder.style.animation =
        "typing 2.5s steps(9)";
}, 3000);

let input = document.querySelector(".input-div input");
input.addEventListener("input", () => {
    if(input.value.length > 0){
        changingPlaceHolder.style.display = "none";
    } else {
        changingPlaceHolder.style.display = "inline-block";
    }
});

// footer links open & close
function footerAccordion() {
  return {
    isOpen: false,
    isDesktop: false,

    checkScreen() {
      this.isDesktop = window.innerWidth >= 1024;

      if (this.isDesktop) {
        this.isOpen = true;
      } else {
        this.isOpen = false;
      }
    },

    toggle() {
      if (!this.isDesktop) {
        this.isOpen = !this.isOpen;
      }
    }
  }
}