const imgUrl = "https://image.tmdb.org/t/p/w400/";

class Movie {
    constructor(id, name, img, date) {
        this.id = id;
        this.name = name;
        this.img = img;
        this.date = date;

        makeAPIRequest(`movie/${this.id}/credits`).then(m => {
            this.individuals = m.cast.map(el => ({ name: el.name, id: el.id , img: el.profile_path}));
            this.individuals = this.individuals.concat(m.crew.filter(el => el.job == "Director").map(el => ({ name: el.name, id: el.id , img: el.profile_path})));
        });
    }

    getIndividual(name) {
        return this.individuals.find(x => x.name.toLowerCase() == name.toLowerCase());
    }

    toHTML() {
        return `<div class="movie"><h1>${this.name}</h1><img alt="${this.name}" src="${this.img}"><p><b>Release date: </b>${this.date}</p><form action=""><label for="${this.name}">Name an actor or director from this film.</label><input type="text" name="${this.name}" id="${this.name}" class="movieInput" required><button type=submit>Try !</button></form></div>`
    }

}

class Individual {
    constructor(id, name, img) {
        this.id = id;
        this.name = name;
        this.img = img;

        makeAPIRequest(`/person/${this.id}/movie_credits`).then(res => {
            this.movies = res.cast.map(el => el.original_title);
            this.movies = this.movies.concat(res.crew.map(el => el.original_title));
        });
    }

    getMovie(name) {
        return this.movies.find(x => x.toLowerCase() == name.toLowerCase());
    }

    toHTML() {
        return `<div class="individual"><h1>${this.name}</h1><img alt="${this.name}" src="${this.img}"><form action=""><label for="${this.name}">Name a movie in which this actor has played.</label><input type="text" name="${this.name}" id="${this.name}" class="personInput" required><button type=submit>Try !</button></form></div>`;
    }
}

async function makeAPIRequest(indent, parameters = {}) {
    const params = Object.entries(parameters).map(entry => {
        const [key, value] = entry;
        return `&${key}=${value}`;
    }).join('');
    try {
        const res = await fetch(`https://api.themoviedb.org/3/${indent}?api_key=33f557e9e8178786b952dd687175138c${params}`);
        return await res.json();
    } catch (message) {
        return console.error(message);
    }
}

async function getMovies(name) {
    const info = await makeAPIRequest("search/movie", { query: name });
    var movieInfo = info.results[0];
    return new Movie(movieInfo.id, movieInfo.original_title, imgUrl + movieInfo.poster_path, movieInfo.release_date);
}

async function getPerson(id) {
    const info = await makeAPIRequest(`/person/${id}/movie_credits`);

}

function addErrorMsg(parent, content) {
    let msg = document.createElement("div");
    msg.classList.add("errorMsg");
    msg.innerHTML = `<p>${content}</p>`;
    parent.insertBefore(msg, parent.childNodes[0]);
}

async function main() {
    let currentMovie = await getMovies("Inception");
    let currentIndividual;
    document.body.innerHTML += currentMovie.toHTML();
    let moviesName = ["inception"];
    let peopleName = [];


    document.addEventListener("submit", async e => {
        e.preventDefault();
        const input = e.target.getElementsByTagName("input")[0];
        const btn = e.target.getElementsByTagName("button")[0];
        const value = input.value.toLowerCase();
        btn.disabled = true;

        switch (input.className) {
            case "movieInput":
                if(peopleName.includes(value)){
                    btn.disabled = false;
                    addErrorMsg(e.target, "You can no longer choose this person.");
                }else{
                    const ind = currentMovie.getIndividual(value)
                    if (ind) {
                        peopleName.push(value);
                        currentIndividual = new Individual(ind.id, ind.name, imgUrl + ind.img);
                        document.body.innerHTML += currentIndividual.toHTML();
                    } else {
                        btn.disabled = false;
                        addErrorMsg(e.target, "The person chosen is not a director or an actor.");
                    }
                }
                break;
            case "personInput":
                if (moviesName.includes(value)) {
                    btn.disabled = false;
                    addErrorMsg(e.target, "You have already informed this film.");
                } else {
                    const movie = currentIndividual.getMovie(value);
                    if(movie){
                        moviesName.push(value);
                        currentMovie = await getMovies(value);
                        document.body.innerHTML += currentMovie.toHTML();
                    }else{
                        btn.disabled = false;
                        addErrorMsg(e.target, "The person did not play in this movie.");
                    }
                }
                break;
        }
    });
}

main();