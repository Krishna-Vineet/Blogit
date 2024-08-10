document.querySelector('.blogs-statistics').addEventListener('pointermove', (el) => {
    document.querySelectorAll('.cursor').forEach((elem) => {
        const rect = elem.getBoundingClientRect();

        elem.style.setProperty("--x", el.clientX - rect.left);
        elem.style.setProperty("--y", el.clientY - rect.top);
    });
});
