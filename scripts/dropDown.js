document.addEventListener("DOMContentLoaded", function () {
    var toggler = document.querySelector(".navbar-toggler");
    toggler.addEventListener("click", function () {
        var nav = document.querySelector("#navbarNav");
        if (nav.classList.contains("show")) {
            nav.classList.remove("show");
        } else {
            nav.classList.add("show");
        }
    });
});