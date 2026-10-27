var pws = "admin"

function login() {
    let password = localStorage.getItem("password") || '';
    if (password == pws) {
        window.location.href = "./form.html"
    }
}

function logout() {
    let password = localStorage.getItem("password") || '';
    if (password != pws) {
        window.location.href = "./index.html"
    }
}
