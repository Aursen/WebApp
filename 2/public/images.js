const liste = document.getElementById("liste");
const title = document.querySelector("h1");

fetch('/images').then(res => res.json()).then(res => {
    if(res){
        title.innerText = "Liste des images sauvegardées";
        liste.innerHTML = res.map(el => `<li><b>Pseudo:</b> ${el.username}, <b>Date de sauvegarde:</b> ${el.date}, <b>Image:</b> <a href="${el.path}">ici</a></li>`);
    }
});